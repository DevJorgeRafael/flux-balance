import * as SQLite from 'expo-sqlite';
import { SCHEMA_DDL } from './schema.sql';
import { migrateCategories } from './migrateCategories';
import { seedDefaultCategories } from './seedDefaultCategories';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
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

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await SQLite.openDatabaseAsync('flux_balance.db', {
      useNewConnection: true,
    });

    // Pragmas seguros
    try {
      await db.execAsync('PRAGMA foreign_keys = ON;');
    } catch (pragmaErr) {
      console.warn('Pragma warning:', pragmaErr);
    }

    // Creación de tablas e índices
    await db.execAsync(SCHEMA_DDL);

    // Migración incremental de categorías y seed idempotente de defaults
    await migrateCategories(db);
    await seedDefaultCategories(db);

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
  await db.execAsync(`
    DELETE FROM transaction_splits;
    DELETE FROM transactions;
    DELETE FROM fixed_term_deposits;
    DELETE FROM accounts;
    DELETE FROM income_categories;
    DELETE FROM expense_categories;
  `);

  await seedDefaultCategories(db);
}

