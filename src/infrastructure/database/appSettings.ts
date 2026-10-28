import { getDatabase } from './db';

async function ensureSettingsTable() {
  const db = await getDatabase();
  await db.runAsync(
    'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
  );
  return db;
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await ensureSettingsTable();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await ensureSettingsTable();
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
    key,
    value,
  ]);
}
