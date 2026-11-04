import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrationRunner';
import { resetFinancialData } from './resetFinancialData';
import { seedDefaultCategories } from './seedDefaultCategories';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;
let sqliteModulePromise: Promise<typeof import('expo-sqlite')> | null = null;

async function loadSQLiteModule(): Promise<typeof import('expo-sqlite')> {
  if (!sqliteModulePromise) {
    sqliteModulePromise = import('expo-sqlite').catch((error) => {
      sqliteModulePromise = null;
      throw error;
    });
  }
  return sqliteModulePromise;
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    try {
      await dbInstance.getFirstAsync('SELECT 1');
      return dbInstance;
    } catch {
      // Si la conexión nativa murió (e.g. fast refresh o garbage collection), reinicializamos
      dbInstance = null;
      initPromise = null;
    }
  }
  if (!initPromise) {
    initPromise = initDatabase();
  }
  return initPromise;
}

export async function initDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const SQLite = await loadSQLiteModule();
    const db = await SQLite.openDatabaseAsync('flux_balance.db', {
      useNewConnection: true,
    });

    // Pragmas seguros
    try {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    } catch (pragmaErr) {
      console.warn('Pragma warning:', pragmaErr);
    }

    // Migraciones versionadas (esquema base, app_settings y futuras versiones)
    await runMigrations(db);

    // Seed idempotente de categorías por defecto
    await db.withExclusiveTransactionAsync(async (txn) => {
      await seedDefaultCategories(txn);
    });

    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Error al inicializar la base de datos SQLite:', error);
    dbInstance = null;
    initPromise = null;
    throw error;
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await resetFinancialData(db);
}

