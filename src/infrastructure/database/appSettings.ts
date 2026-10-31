import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './db';

type SettingsWriteDatabase = Pick<SQLiteDatabase, 'runAsync'>;

async function ensureSettingsTable(db: SettingsWriteDatabase) {
  await db.runAsync(
    'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
  );
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  await ensureSettingsTable(db);
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await ensureSettingsTable(txn);
    await txn.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
      key,
      value,
    ]);
  });
}
