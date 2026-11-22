import { getDatabase } from './db';

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  // Un solo INSERT OR REPLACE ya es atómico; la transacción exclusiva abría
  // una segunda conexión y podía chocar con otras escrituras en curso.
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
    key,
    value,
  ]);
}
