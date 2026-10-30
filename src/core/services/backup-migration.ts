import {
  BACKUP_SCHEMA_VERSION,
  type BackupValidationError,
} from '../models/backup';

type UnknownRecord = Record<string, unknown>;

export type BackupMigrationResult =
  | { ok: true; value: unknown }
  | { ok: false; error: BackupValidationError };

type BackupMigration = (backup: UnknownRecord) => UnknownRecord;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapRecordArray(
  value: unknown,
  map: (item: unknown) => unknown
): unknown {
  return Array.isArray(value) ? value.map(map) : value;
}

function migrateCategory(
  value: unknown,
  type: 'INCOME' | 'EXPENSE',
  fallbackCreatedAt: string
): unknown {
  if (!isRecord(value)) return value;

  return {
    ...value,
    type: value.type ?? type,
    isDefault: value.isDefault ?? false,
    sortOrder: value.sortOrder ?? 0,
    createdAt: value.createdAt ?? fallbackCreatedAt,
  };
}

function migrateV0ToV1(backup: UnknownRecord): UnknownRecord {
  const fallbackCreatedAt =
    typeof backup.exportedAt === 'string' ? backup.exportedAt : '';

  return {
    ...backup,
    schemaVersion: 1,
    accounts: mapRecordArray(backup.accounts, (value) => {
      if (!isRecord(value)) return value;

      return {
        ...value,
        annualRate: value.annualRate ?? null,
        isArchived: value.isArchived ?? false,
        fixedTermDeposits: value.fixedTermDeposits ?? [],
      };
    }),
    incomeCategories: mapRecordArray(backup.incomeCategories, (value) =>
      migrateCategory(value, 'INCOME', fallbackCreatedAt)
    ),
    expenseCategories: mapRecordArray(backup.expenseCategories, (value) =>
      migrateCategory(value, 'EXPENSE', fallbackCreatedAt)
    ),
    transactions: mapRecordArray(backup.transactions, (value) => {
      if (!isRecord(value)) return value;

      return {
        ...value,
        description: value.description ?? null,
        createdAt: value.createdAt ?? value.date ?? fallbackCreatedAt,
        splits: mapRecordArray(value.splits, (split) => {
          if (!isRecord(split)) return split;
          return { ...split, notes: split.notes ?? null };
        }),
      };
    }),
  };
}

const MIGRATIONS: Record<number, BackupMigration> = {
  0: migrateV0ToV1,
};

export function migrateBackup(raw: unknown): BackupMigrationResult {
  if (!isRecord(raw)) {
    return { ok: true, value: raw };
  }

  const schemaVersion = raw.schemaVersion;
  if (
    typeof schemaVersion !== 'number' ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion < 0
  ) {
    return {
      ok: false,
      error: {
        code: 'invalidSchemaVersion',
        path: 'schemaVersion',
      },
    };
  }

  if (schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'futureSchemaVersion',
        path: 'schemaVersion',
        params: { version: schemaVersion, supported: BACKUP_SCHEMA_VERSION },
      },
    };
  }

  let migrated: UnknownRecord = raw;
  let version = schemaVersion;

  while (version < BACKUP_SCHEMA_VERSION) {
    const migration = MIGRATIONS[version];
    if (!migration) {
      return {
        ok: false,
        error: {
          code: 'unsupportedSchemaVersion',
          path: 'schemaVersion',
          params: { version, supported: BACKUP_SCHEMA_VERSION },
        },
      };
    }

    migrated = migration(migrated);
    version += 1;
    migrated.schemaVersion = version;
  }

  return { ok: true, value: migrated };
}
