import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BackupAccount,
  BackupCategory,
  BackupData,
  BackupFile,
  BackupFixedTermDeposit,
  BackupTransaction,
  BackupTransactionSplit,
} from '../../core/models/backup';

type BackupDatabase = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'withExclusiveTransactionAsync'
>;

interface AccountRow {
  id: string;
  name: string;
  type: BackupAccount['type'];
  balance: number;
  currency: string;
  annual_rate: number | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface DepositRow {
  id: string;
  account_id: string;
  principal_amount: number;
  annual_rate: number;
  term_months: number;
  start_date: string;
  maturity_date: string;
  status: BackupFixedTermDeposit['status'];
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: number;
  sort_order: number;
  created_at: string;
}

interface TransactionRow {
  id: string;
  type: BackupTransaction['type'];
  total_amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

interface SplitRow {
  id: string;
  transaction_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  notes: string | null;
}

interface ForeignKeyViolation {
  table: string;
  rowid: number;
  parent: string;
  fkid: number;
}

function mapDeposit(row: DepositRow): BackupFixedTermDeposit {
  return {
    id: row.id,
    accountId: row.account_id,
    principalAmount: row.principal_amount,
    annualRate: row.annual_rate,
    termMonths: row.term_months,
    startDate: row.start_date,
    maturityDate: row.maturity_date,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCategory(row: CategoryRow, type: BackupCategory['type']): BackupCategory {
  return {
    id: row.id,
    name: row.name,
    type,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapSplit(row: SplitRow): BackupTransactionSplit {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: row.amount,
    notes: row.notes,
  };
}

export async function buildBackupFromDatabase(
  db: BackupDatabase
): Promise<BackupData> {
  const [accountRows, depositRows, incomeRows, expenseRows, transactionRows, splitRows] =
    await Promise.all([
      db.getAllAsync<AccountRow>(
        'SELECT * FROM accounts ORDER BY created_at ASC, id ASC'
      ),
      db.getAllAsync<DepositRow>(
        'SELECT * FROM fixed_term_deposits ORDER BY account_id ASC, maturity_date ASC, id ASC'
      ),
      db.getAllAsync<CategoryRow>(
        'SELECT * FROM income_categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC, id ASC'
      ),
      db.getAllAsync<CategoryRow>(
        'SELECT * FROM expense_categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC, id ASC'
      ),
      db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions ORDER BY date DESC, created_at DESC, id ASC'
      ),
      db.getAllAsync<SplitRow>(
        'SELECT * FROM transaction_splits ORDER BY transaction_id ASC, id ASC'
      ),
    ]);

  const depositsByAccount = new Map<string, BackupFixedTermDeposit[]>();
  for (const row of depositRows) {
    const deposits = depositsByAccount.get(row.account_id) ?? [];
    deposits.push(mapDeposit(row));
    depositsByAccount.set(row.account_id, deposits);
  }

  const splitsByTransaction = new Map<string, BackupTransactionSplit[]>();
  for (const row of splitRows) {
    const splits = splitsByTransaction.get(row.transaction_id) ?? [];
    splits.push(mapSplit(row));
    splitsByTransaction.set(row.transaction_id, splits);
  }

  const accounts: BackupAccount[] = accountRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: row.currency,
    annualRate: row.annual_rate,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fixedTermDeposits: depositsByAccount.get(row.id) ?? [],
  }));

  return {
    accounts,
    incomeCategories: incomeRows.map((row) => mapCategory(row, 'INCOME')),
    expenseCategories: expenseRows.map((row) => mapCategory(row, 'EXPENSE')),
    transactions: transactionRows.map((row) => ({
      id: row.id,
      type: row.type,
      totalAmount: row.total_amount,
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
      splits: splitsByTransaction.get(row.id) ?? [],
    })),
  };
}

export async function importBackupIntoDatabase(
  db: BackupDatabase,
  backup: BackupFile
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`
      DELETE FROM transaction_splits;
      DELETE FROM transactions;
      DELETE FROM fixed_term_deposits;
      DELETE FROM accounts;
      DELETE FROM income_categories;
      DELETE FROM expense_categories;
      CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);

    for (const account of backup.accounts) {
      await txn.runAsync(
        `INSERT INTO accounts
           (id, name, type, balance, currency, annual_rate, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.id,
          account.name,
          account.type,
          account.balance,
          account.currency,
          account.annualRate,
          account.isArchived ? 1 : 0,
          account.createdAt,
          account.updatedAt,
        ]
      );

      for (const deposit of account.fixedTermDeposits) {
        await txn.runAsync(
          `INSERT INTO fixed_term_deposits
             (id, account_id, principal_amount, annual_rate, term_months, start_date, maturity_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            deposit.id,
            deposit.accountId,
            deposit.principalAmount,
            deposit.annualRate,
            deposit.termMonths,
            deposit.startDate,
            deposit.maturityDate,
            deposit.status,
            deposit.createdAt,
          ]
        );
      }
    }

    for (const category of backup.incomeCategories) {
      await txn.runAsync(
        `INSERT INTO income_categories
           (id, name, color, icon, is_default, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.color,
          category.icon,
          category.isDefault ? 1 : 0,
          category.sortOrder,
          category.createdAt,
        ]
      );
    }

    for (const category of backup.expenseCategories) {
      await txn.runAsync(
        `INSERT INTO expense_categories
           (id, name, color, icon, is_default, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.color,
          category.icon,
          category.isDefault ? 1 : 0,
          category.sortOrder,
          category.createdAt,
        ]
      );
    }

    for (const transaction of backup.transactions) {
      await txn.runAsync(
        `INSERT INTO transactions
           (id, type, total_amount, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.type,
          transaction.totalAmount,
          transaction.description,
          transaction.date,
          transaction.createdAt,
        ]
      );

      for (const split of transaction.splits) {
        await txn.runAsync(
          `INSERT INTO transaction_splits
             (id, transaction_id, account_id, category_id, amount, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            split.id,
            split.transactionId,
            split.accountId,
            split.categoryId,
            split.amount,
            split.notes,
          ]
        );
      }
    }

    await txn.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      ['currency', backup.currency]
    );

    const violations = await txn.getAllAsync<ForeignKeyViolation>(
      'PRAGMA foreign_key_check'
    );

    if (violations.length > 0) {
      throw new Error('El backup contiene referencias inválidas.');
    }
  });
}
