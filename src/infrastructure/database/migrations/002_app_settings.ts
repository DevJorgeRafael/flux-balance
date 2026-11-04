import type { Migration } from '../migrationRunner';

export const migration: Migration = {
  version: 2,
  name: 'app_settings',
  up: async (db) => {
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
    );
  },
};
