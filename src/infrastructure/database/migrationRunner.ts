import { MIGRATIONS } from './migrations/index';

export type MigrationBindValue =
  | string
  | number
  | null
  | boolean
  | Uint8Array
  | ArrayBuffer;

export type MigrationBindParams =
  | Record<string, MigrationBindValue>
  | MigrationBindValue[];

export interface MigrationRunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface MigrationDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    params: MigrationBindParams
  ): Promise<MigrationRunResult>;
  runAsync(
    source: string,
    ...params: MigrationBindValue[]
  ): Promise<MigrationRunResult>;
  getFirstAsync<T>(
    source: string,
    params: MigrationBindParams
  ): Promise<T | null>;
  getFirstAsync<T>(
    source: string,
    ...params: MigrationBindValue[]
  ): Promise<T | null>;
  getAllAsync<T>(source: string, params: MigrationBindParams): Promise<T[]>;
  getAllAsync<T>(
    source: string,
    ...params: MigrationBindValue[]
  ): Promise<T[]>;
  withExclusiveTransactionAsync(
    task: (txn: MigrationDatabase) => Promise<void>
  ): Promise<void>;
}

export interface Migration {
  version: number;
  name: string;
  requiresForeignKeysOff?: boolean;
  up: (db: MigrationDatabase) => Promise<void>;
}

interface UserVersionRow {
  user_version: number;
}

interface ForeignKeyViolation {
  table: string;
  rowid: number;
  parent: string;
  fkid: number;
}

export async function runMigrations(
  db: MigrationDatabase,
  migrations: readonly Migration[] = MIGRATIONS
): Promise<void> {
  const versionRow = await db.getFirstAsync<UserVersionRow>(
    'PRAGMA user_version'
  );
  const currentVersion = versionRow?.user_version ?? 0;

  const pending = [...migrations]
    .filter((migration) => migration.version > currentVersion)
    .sort((left, right) => left.version - right.version);

  for (const migration of pending) {
    await runMigration(db, migration);
  }

  const violations = await db.getAllAsync<ForeignKeyViolation>(
    'PRAGMA foreign_key_check'
  );

  if (violations.length > 0) {
    const tables = violations
      .map((violation) => violation.table)
      .join(', ');
    console.warn(
      `La verificación de claves foráneas encontró ${violations.length} fila(s) inválida(s) en: ${tables}.`
    );
  }
}

async function runMigration(
  db: MigrationDatabase,
  migration: Migration
): Promise<void> {
  const requiresForeignKeysOff = migration.requiresForeignKeysOff === true;

  if (requiresForeignKeysOff) {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
  }

  let migrationError: unknown;

  try {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await migration.up(txn);
      await txn.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  } catch (error) {
    migrationError = error;
    throw error;
  } finally {
    if (requiresForeignKeysOff) {
      try {
        await db.execAsync('PRAGMA foreign_keys = ON;');
      } catch (pragmaError) {
        if (migrationError === undefined) {
          throw pragmaError;
        }
        console.warn(
          'No se pudo reactivar PRAGMA foreign_keys después de la migración:',
          pragmaError
        );
      }
    }
  }
}
