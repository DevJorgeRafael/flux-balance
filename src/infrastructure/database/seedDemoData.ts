import { getDatabase } from './db';
import { buildDemoDataSet } from './demoData';
import { seedDefaultCategories } from './seedDefaultCategories';

export interface DemoSeedResult {
  accounts: number;
  transactions: number;
}

export async function seedDemoData(loadedAt: Date = new Date()): Promise<DemoSeedResult> {
  const db = await getDatabase();
  const data = buildDemoDataSet(loadedAt);

  await db.withExclusiveTransactionAsync(async (txn) => {
    await seedDefaultCategories(txn);

    await txn.execAsync(`
      DELETE FROM transactions
      WHERE id LIKE 'demo-%'
         OR id IN (
           SELECT transaction_id
           FROM transaction_splits
           WHERE account_id LIKE 'demo-%'
         );
      DELETE FROM transaction_splits
      WHERE id LIKE 'demo-%' OR account_id LIKE 'demo-%';
      DELETE FROM fixed_term_deposits
      WHERE id LIKE 'demo-%' OR account_id LIKE 'demo-%';
      DELETE FROM accounts
      WHERE id LIKE 'demo-%';
    `);

    for (const account of data.accounts) {
      await txn.runAsync(
        `INSERT INTO accounts
         (id, name, type, balance, currency, annual_rate, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'USD', ?, 0, ?, ?);`,
        [
          account.id,
          account.name,
          account.type,
          account.balance,
          account.annualRate,
          account.createdAt,
          account.updatedAt,
        ]
      );
    }

    for (const transaction of data.transactions) {
      await txn.runAsync(
        `INSERT INTO transactions (id, type, total_amount, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          transaction.id,
          transaction.type,
          transaction.totalAmount,
          transaction.description,
          transaction.date,
          transaction.createdAt,
        ]
      );

      await txn.runAsync(
        `INSERT INTO transaction_splits (id, transaction_id, account_id, category_id, amount)
         VALUES (?, ?, ?, ?, ?);`,
        [
          transaction.split.id,
          transaction.id,
          transaction.split.accountId,
          transaction.split.categoryId,
          transaction.split.amount,
        ]
      );
    }
  });

  return {
    accounts: data.accounts.length,
    transactions: data.transactions.length,
  };
}
