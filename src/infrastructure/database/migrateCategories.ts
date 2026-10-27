import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CATEGORY_INDEXES_DDL,
  CATEGORY_TABLES_DDL,
  SPLIT_INDEXES_DDL,
} from './schema.sql';
import {
  assignCategoryPaletteColors,
  buildCategoryMigrationPlan,
  type LegacyCategoryRow,
} from './categoryMigrationPlan';

type MigrationDatabase = Pick<
  SQLiteDatabase,
  | 'execAsync'
  | 'getAllAsync'
  | 'getFirstAsync'
  | 'runAsync'
  | 'withTransactionAsync'
>;

const BACKUP_TABLE = 'categories_backup_v1';

const BACKUP_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS ${BACKUP_TABLE} (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    icon TEXT,
    color TEXT,
    is_default INTEGER NOT NULL,
    created_at TEXT,
    backed_up_at TEXT NOT NULL
);
`;

const TRANSACTION_SPLITS_DDL = `
CREATE TABLE transaction_splits_migrated (
    id TEXT PRIMARY KEY NOT NULL,
    transaction_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);
`;

async function tableExists(db: MigrationDatabase, table: string) {
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table]
  );
  return Boolean(row);
}

async function hasLegacyCategoryForeignKey(db: MigrationDatabase) {
  const foreignKeys = await db.getAllAsync<{ table: string; from: string }>(
    'PRAGMA foreign_key_list(transaction_splits)'
  );
  return foreignKeys.some(
    (foreignKey) => foreignKey.table === 'categories' && foreignKey.from === 'category_id'
  );
}

async function copyLegacyCategoriesToBackup(
  db: MigrationDatabase,
  backedUpAt: string
) {
  await db.execAsync(BACKUP_TABLE_DDL);
  await db.runAsync(
    `INSERT OR IGNORE INTO ${BACKUP_TABLE}
       (id, name, type, icon, color, is_default, created_at, backed_up_at)
     SELECT id, name, type, icon, color, is_default, created_at, ?
     FROM categories`,
    [backedUpAt]
  );

  const gap = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM categories c
     LEFT JOIN ${BACKUP_TABLE} b ON b.id = c.id
     WHERE b.id IS NULL`
  );

  if ((gap?.count ?? 0) > 0) {
    throw new Error('No se pudo respaldar todas las categorías antes de migrar.');
  }
}

async function insertMigratedCategories(
  db: MigrationDatabase,
  table: 'income_categories' | 'expense_categories',
  rows: ReturnType<typeof buildCategoryMigrationPlan>['income']
) {
  for (const row of rows) {
    await db.runAsync(
      `INSERT OR IGNORE INTO ${table}
         (id, name, color, icon, is_default, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.name,
        row.color,
        row.icon,
        row.is_default,
        row.sort_order,
        row.created_at,
      ]
    );
  }
}

async function ensureAllLegacyCategoriesWereMigrated(db: MigrationDatabase) {
  const missing = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM categories c
     WHERE NOT EXISTS (SELECT 1 FROM income_categories ic WHERE ic.id = c.id)
       AND NOT EXISTS (SELECT 1 FROM expense_categories ec WHERE ec.id = c.id)`
  );

  if ((missing?.count ?? 0) > 0) {
    throw new Error('La migración de categorías dejó categorías sin copiar.');
  }
}

async function rebuildTransactionSplits(db: MigrationDatabase) {
  const before = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM transaction_splits'
  );

  await db.execAsync(`
    DROP TABLE IF EXISTS transaction_splits_migrated;
    ${TRANSACTION_SPLITS_DDL}
    INSERT INTO transaction_splits_migrated
      (id, transaction_id, account_id, category_id, amount, notes)
    SELECT id, transaction_id, account_id, category_id, amount, notes
    FROM transaction_splits;
  `);

  const after = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM transaction_splits_migrated'
  );

  if ((before?.count ?? 0) !== (after?.count ?? 0)) {
    throw new Error('La migración de movimientos no conservó todas las divisiones.');
  }

  await db.execAsync(`
    DROP TABLE transaction_splits;
    ALTER TABLE transaction_splits_migrated RENAME TO transaction_splits;
  `);
}

interface StoredCategoryColorRow {
  id: string;
  name: string;
  color: string | null;
  is_default: number;
  sort_order: number;
}

function normalizeColor(color: string | null): string | null {
  const normalized = color?.trim();
  return normalized ? normalized : null;
}

async function migrateStoredCategoryColors(db: MigrationDatabase) {
  for (const type of ['INCOME', 'EXPENSE'] as const) {
    const table =
      type === 'INCOME' ? 'income_categories' : 'expense_categories';
    const rows = await db.getAllAsync<StoredCategoryColorRow>(
      `SELECT id, name, color, is_default, sort_order
       FROM ${table}
       ORDER BY sort_order ASC, name COLLATE NOCASE ASC, id ASC`
    );
    const coloredRows = assignCategoryPaletteColors(type, rows);

    for (let index = 0; index < rows.length; index += 1) {
      const currentRow = rows[index]!;
      const nextRow = coloredRows[index]!;

      if (normalizeColor(currentRow.color) === nextRow.color) continue;

      await db.runAsync(`UPDATE ${table} SET color = ? WHERE id = ?`, [
        nextRow.color,
        nextRow.id,
      ]);
    }
  }
}

export async function migrateCategories(
  db: MigrationDatabase,
  migratedAt: Date = new Date()
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(CATEGORY_TABLES_DDL);

    const legacyTableExists = await tableExists(db, 'categories');

    if (legacyTableExists) {
      await copyLegacyCategoriesToBackup(db, migratedAt.toISOString());

      const legacyCategories = await db.getAllAsync<LegacyCategoryRow>(
        `SELECT id, name, type, icon, color, is_default, created_at
         FROM categories
         ORDER BY is_default DESC, name COLLATE NOCASE, id`
      );
      const plan = buildCategoryMigrationPlan(legacyCategories);

      await insertMigratedCategories(db, 'income_categories', plan.income);
      await insertMigratedCategories(db, 'expense_categories', plan.expense);
      await ensureAllLegacyCategoriesWereMigrated(db);

      if (await hasLegacyCategoryForeignKey(db)) {
        await rebuildTransactionSplits(db);
      }

      await db.execAsync('DROP TABLE categories;');
    } else if (await hasLegacyCategoryForeignKey(db)) {
      await rebuildTransactionSplits(db);
    }

    await db.execAsync(CATEGORY_INDEXES_DDL);
    await db.execAsync(SPLIT_INDEXES_DDL);
    await migrateStoredCategoryColors(db);
  });
}
