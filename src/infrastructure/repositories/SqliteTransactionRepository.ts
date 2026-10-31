import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  ITransactionRepository,
  MonthlyTotals,
} from '@/core/repositories/ITransactionRepository';
import type {
  Transaction,
  TransactionType,
  TransactionSplit,
  CreateTransactionDTO,
  TransactionFilterDTO,
} from '@/core/models/transaction';
import { categoryTableForType } from '@/core/services/category-resolution';
import { getDatabase } from '../database/db';

type DatabaseProvider = () => Promise<SQLiteDatabase>;
type TransactionReadDatabase = Pick<
  SQLiteDatabase,
  'getFirstAsync' | 'getAllAsync'
>;

interface TransactionRow {
  id: string;
  type: TransactionType;
  total_amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

interface SplitRow {
  id: string;
  transaction_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  notes: string | null;
  account_name?: string;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export class SqliteTransactionRepository implements ITransactionRepository {
  private readonly getDb: DatabaseProvider;

  constructor(getDb: DatabaseProvider = getDatabase) {
    this.getDb = getDb;
  }

  async getAll(filter?: TransactionFilterDTO): Promise<Transaction[]> {
    const db = await this.getDb();
    let query = 'SELECT DISTINCT t.* FROM transactions t';
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (filter?.accountId) {
      query += ' INNER JOIN transaction_splits s ON s.transaction_id = t.id';
      conditions.push('s.account_id = ?');
      params.push(filter.accountId);
    }
    if (filter?.categoryId) {
      if (!filter?.accountId) {
        query += ' INNER JOIN transaction_splits s ON s.transaction_id = t.id';
      }
      conditions.push('s.category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter?.type) {
      conditions.push('t.type = ?');
      params.push(filter.type);
    }
    if (filter?.startDate) {
      conditions.push('t.date >= ?');
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      conditions.push('t.date <= ?');
      params.push(filter.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      if (filter?.offset) {
        query += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    const txRows = params.length > 0
      ? await db.getAllAsync<TransactionRow>(query, params)
      : await db.getAllAsync<TransactionRow>(query);
    if (txRows.length === 0) return [];

    const txIds = txRows.map((r) => r.id);
    const splitRows = await db.getAllAsync<SplitRow>(`
      SELECT
        s.*,
        a.name AS account_name,
        CASE WHEN t.type = 'INCOME' THEN ic.name WHEN t.type = 'EXPENSE' THEN ec.name END AS category_name,
        CASE WHEN t.type = 'INCOME' THEN ic.icon WHEN t.type = 'EXPENSE' THEN ec.icon END AS category_icon,
        CASE WHEN t.type = 'INCOME' THEN ic.color WHEN t.type = 'EXPENSE' THEN ec.color END AS category_color
      FROM transaction_splits s
      INNER JOIN transactions t ON t.id = s.transaction_id
      LEFT JOIN accounts a ON a.id = s.account_id
      LEFT JOIN income_categories ic ON t.type = 'INCOME' AND ic.id = s.category_id
      LEFT JOIN expense_categories ec ON t.type = 'EXPENSE' AND ec.id = s.category_id
      WHERE s.transaction_id IN (SELECT value FROM json_each(?))
    `, [JSON.stringify(txIds)]);

    const splitsByTx: Record<string, TransactionSplit[]> = {};
    for (const s of splitRows) {
      if (!splitsByTx[s.transaction_id]) splitsByTx[s.transaction_id] = [];
      splitsByTx[s.transaction_id].push({
        id: s.id,
        transactionId: s.transaction_id,
        accountId: s.account_id,
        categoryId: s.category_id,
        amount: s.amount,
        notes: s.notes,
        accountName: s.account_name,
        categoryName: s.category_name ?? undefined,
        categoryIcon: s.category_icon ?? undefined,
        categoryColor: s.category_color ?? undefined,
      });
    }

    return txRows.map((tx) => ({
      id: tx.id,
      type: tx.type,
      totalAmount: tx.total_amount,
      description: tx.description,
      date: tx.date,
      createdAt: tx.created_at,
      splits: splitsByTx[tx.id] ?? [],
    }));
  }

  async getById(id: string): Promise<Transaction | null> {
    if (!id) return null;
    const db = await this.getDb();
    return this.getByIdWithDb(db, id);
  }

  private async getByIdWithDb(
    db: TransactionReadDatabase,
    id: string
  ): Promise<Transaction | null> {
    const tx = await db.getFirstAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    if (!tx) return null;

    const splitRows = await db.getAllAsync<SplitRow>(`
      SELECT
        s.*,
        a.name AS account_name,
        CASE WHEN t.type = 'INCOME' THEN ic.name WHEN t.type = 'EXPENSE' THEN ec.name END AS category_name,
        CASE WHEN t.type = 'INCOME' THEN ic.icon WHEN t.type = 'EXPENSE' THEN ec.icon END AS category_icon,
        CASE WHEN t.type = 'INCOME' THEN ic.color WHEN t.type = 'EXPENSE' THEN ec.color END AS category_color
      FROM transaction_splits s
      INNER JOIN transactions t ON t.id = s.transaction_id
      LEFT JOIN accounts a ON a.id = s.account_id
      LEFT JOIN income_categories ic ON t.type = 'INCOME' AND ic.id = s.category_id
      LEFT JOIN expense_categories ec ON t.type = 'EXPENSE' AND ec.id = s.category_id
      WHERE s.transaction_id = ?
    `, [id]);

    const splits: TransactionSplit[] = splitRows.map((s) => ({
      id: s.id,
      transactionId: s.transaction_id,
      accountId: s.account_id,
      categoryId: s.category_id,
      amount: s.amount,
      notes: s.notes,
      accountName: s.account_name,
      categoryName: s.category_name ?? undefined,
      categoryIcon: s.category_icon ?? undefined,
      categoryColor: s.category_color ?? undefined,
    }));

    return {
      id: tx.id,
      type: tx.type,
      totalAmount: tx.total_amount,
      description: tx.description,
      date: tx.date,
      createdAt: tx.created_at,
      splits,
    };
  }

  async createWithSplits(data: CreateTransactionDTO): Promise<Transaction> {
    const db = await this.getDb();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const splits = data.splits.map((split) => ({
      ...split,
      categoryId: split.categoryId?.trim() ?? '',
    }));
    let created: Transaction | null = null;

    await db.withExclusiveTransactionAsync(async (txn) => {
      if (data.type === 'INCOME' || data.type === 'EXPENSE') {
        const table = categoryTableForType(data.type);

        for (const split of splits) {
          if (!split.categoryId) continue;

          const category = await txn.getFirstAsync<{ id: string }>(
            `SELECT id FROM ${table} WHERE id = ?`,
            [split.categoryId]
          );

          if (!category) {
            throw new Error(
              `La categoría ${split.categoryId} no existe para movimientos ${data.type}.`
            );
          }
        }
      }

      for (const split of splits) {
        const account = await txn.getFirstAsync<{ id: string }>(
          'SELECT id FROM accounts WHERE id = ?',
          [split.accountId]
        );

        if (!account) {
          throw new Error(`La cuenta ${split.accountId} no existe.`);
        }
      }

      // 1. Insertar transacción principal
      if (data.description) {
        await txn.runAsync(
          `INSERT INTO transactions (id, type, total_amount, description, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [txId, data.type, data.totalAmount, data.description, data.date, now]
        );
      } else {
        await txn.runAsync(
          `INSERT INTO transactions (id, type, total_amount, date, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [txId, data.type, data.totalAmount, data.date, now]
        );
      }

      // 2. Insertar cada división (split) y actualizar saldo de la cuenta correspondiente
      for (const split of splits) {
        const splitId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        if (split.notes) {
          await txn.runAsync(
            `INSERT INTO transaction_splits (id, transaction_id, account_id, category_id, amount, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [splitId, txId, split.accountId, split.categoryId, split.amount, split.notes]
          );
        } else {
          await txn.runAsync(
            `INSERT INTO transaction_splits (id, transaction_id, account_id, category_id, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [splitId, txId, split.accountId, split.categoryId, split.amount]
          );
        }

        // Actualizar saldo: los ingresos suman, los gastos restan
        const balanceDelta = data.type === 'INCOME' ? split.amount : -split.amount;
        await txn.runAsync(
          'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
          [balanceDelta, now, split.accountId]
        );
      }

      created = await this.getByIdWithDb(txn, txId);
    });

    return created!;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      const tx = await this.getByIdWithDb(txn, id);
      if (!tx) return;

      const now = new Date().toISOString();
      // Revertir cambios de saldo
      for (const split of tx.splits) {
        const revertDelta = tx.type === 'INCOME' ? -split.amount : split.amount;
        await txn.runAsync(
          'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
          [revertDelta, now, split.accountId]
        );
      }
      // Eliminar transacción
      await txn.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    });
  }

  async getMonthlyTotals(yearMonth: string): Promise<MonthlyTotals> {
    const db = await this.getDb();
    const start = `${yearMonth}-01`;
    const end = `${yearMonth}-31T23:59:59`;

    const incomeRow = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(total_amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
      [start, end]
    );

    const expenseRow = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(total_amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
      [start, end]
    );

    const totalIncome = incomeRow?.total ?? 0;
    const totalExpense = expenseRow?.total ?? 0;

    return {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
    };
  }
}
