import type { SQLiteDatabase } from 'expo-sqlite';
import { seedDefaultCategories } from './seedDefaultCategories';

type ResetDatabase = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'withTransactionAsync'
>;

const CLEAR_FINANCIAL_DATA_SQL = `
  DELETE FROM transaction_splits;
  DELETE FROM transactions;
  DELETE FROM fixed_term_deposits;
  DELETE FROM accounts;
  DELETE FROM income_categories;
  DELETE FROM expense_categories;
`;

export async function resetFinancialData(db: ResetDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(CLEAR_FINANCIAL_DATA_SQL);
    await seedDefaultCategories(db);
  });
}
