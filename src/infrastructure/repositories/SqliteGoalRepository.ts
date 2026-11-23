import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateGoalDTO, Goal, UpdateGoalDTO } from '@/core/models/goal';
import {
  isFutureGoalDeadline,
  isValidGoalName,
} from '@/core/services/financial-twin';
import { getDatabase } from '../database/db';

type DatabaseProvider = () => Promise<SQLiteDatabase>;

interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  deadline: string;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    deadline: row.deadline,
    accountId: row.account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateAmount(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('El importe de la meta debe ser mayor que cero.');
  }
}

export class SqliteGoalRepository {
  private readonly getDb: DatabaseProvider;

  constructor(getDb: DatabaseProvider = getDatabase) {
    this.getDb = getDb;
  }

  async getAll(): Promise<Goal[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<GoalRow>(
      'SELECT * FROM goals ORDER BY deadline ASC, name COLLATE NOCASE ASC'
    );
    return rows.map(mapGoal);
  }

  async getById(id: string): Promise<Goal | null> {
    if (!id) return null;
    const db = await this.getDb();
    const row = await db.getFirstAsync<GoalRow>(
      'SELECT * FROM goals WHERE id = ?',
      [id]
    );
    return row ? mapGoal(row) : null;
  }

  async create(data: CreateGoalDTO): Promise<Goal> {
    if (!isValidGoalName(data.name)) throw new Error('Nombre de meta inválido.');
    validateAmount(data.targetAmount);
    if (!isFutureGoalDeadline(data.deadline, new Date())) {
      throw new Error('La fecha límite debe ser futura.');
    }

    const db = await this.getDb();
    if (data.accountId) {
      const account = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM accounts WHERE id = ?',
        [data.accountId]
      );
      if (!account) throw new Error('La cuenta de la meta no existe.');
    }

    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO goals
         (id, name, target_amount, deadline, account_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name.trim(), data.targetAmount, data.deadline, data.accountId ?? null, now, now]
    );
    const created = await this.getById(id);
    if (!created) throw new Error('No se pudo crear la meta.');
    return created;
  }

  async update(id: string, data: UpdateGoalDTO): Promise<Goal> {
    const current = await this.getById(id);
    if (!current) throw new Error('La meta no existe.');

    const name = data.name ?? current.name;
    const targetAmount = data.targetAmount ?? current.targetAmount;
    const deadline = data.deadline ?? current.deadline;
    const accountId =
      data.accountId === undefined ? current.accountId : data.accountId;

    if (!isValidGoalName(name)) throw new Error('Nombre de meta inválido.');
    validateAmount(targetAmount);
    if (!isFutureGoalDeadline(deadline, new Date())) {
      throw new Error('La fecha límite debe ser futura.');
    }

    const db = await this.getDb();
    await db.runAsync(
      `UPDATE goals
          SET name = ?, target_amount = ?, deadline = ?, account_id = ?, updated_at = ?
        WHERE id = ?`,
      [name.trim(), targetAmount, deadline, accountId, new Date().toISOString(), id]
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error('No se pudo actualizar la meta.');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  }
}
