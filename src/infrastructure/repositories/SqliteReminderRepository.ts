import type { SQLiteDatabase } from 'expo-sqlite';
import type { IReminderRepository } from '@/core/repositories/IReminderRepository';
import type {
  CreateReminderDTO,
  Reminder,
  ReminderRecurrence,
  ReminderType,
  UpdateReminderDTO,
} from '@/core/models/reminder';
import {
  MAX_AMOUNT,
  MAX_REMINDER_TITLE_LENGTH,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '@/core/constants/inputLimits';
import { categoryTableForType } from '@/core/services/category-resolution';
import {
  isValidReminderDate,
  isValidReminderTime,
  nextReminderRunAt,
} from '@/core/services/reminder-schedule';
import { getDatabase } from '../database/db';

type DatabaseProvider = () => Promise<SQLiteDatabase>;
type NowProvider = () => Date;
type ReminderDatabase = Pick<
  SQLiteDatabase,
  'getFirstAsync' | 'getAllAsync' | 'runAsync'
>;

export type ReminderValidationErrorCode =
  | 'TITLE_REQUIRED'
  | 'TITLE_TOO_LONG'
  | 'DESCRIPTION_TOO_LONG'
  | 'TYPE_INVALID'
  | 'RECURRENCE_INVALID'
  | 'AMOUNT_INVALID'
  | 'TIME_INVALID'
  | 'START_DATE_INVALID'
  | 'START_DATE_IN_PAST'
  | 'ACCOUNT_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'SENT_AT_INVALID'
  | 'SCHEDULE_INVALID';

export class ReminderValidationError extends Error {
  readonly code: ReminderValidationErrorCode;

  constructor(code: ReminderValidationErrorCode, message: string) {
    super(message);
    this.name = 'ReminderValidationError';
    this.code = code;
  }
}

interface ReminderRow {
  id: string;
  title: string;
  type: ReminderType;
  description: string | null;
  amount: number | null;
  account_id: string | null;
  category_id: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  start_date: string;
  next_run_at: string | null;
  is_archived: number;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReminderFields {
  title: string;
  type: ReminderType;
  description?: string | null;
  amount?: number | null;
  accountId?: string | null;
  categoryId?: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
  isArchived: boolean;
}

interface NormalizedReminderFields {
  title: string;
  type: ReminderType;
  description: string | null;
  amount: number | null;
  accountId: string | null;
  categoryId: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
  isArchived: boolean;
}

const RECURRENCES: readonly ReminderRecurrence[] = [
  'ONCE',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
];

function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description,
    amount: row.amount,
    accountId: row.account_id,
    categoryId: row.category_id,
    recurrence: row.recurrence,
    time: row.time,
    startDate: row.start_date,
    nextRunAt: row.next_run_at,
    isArchived: row.is_archived === 1,
    lastNotifiedAt: row.last_notified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isIsoUtcTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export class SqliteReminderRepository implements IReminderRepository {
  private readonly getDb: DatabaseProvider;
  private readonly now: NowProvider;

  constructor(
    getDb: DatabaseProvider = getDatabase,
    now: NowProvider = () => new Date()
  ) {
    this.getDb = getDb;
    this.now = now;
  }

  async getAll(includeArchived = false): Promise<Reminder[]> {
    const db = await this.getDb();
    const query = includeArchived
      ? 'SELECT * FROM reminders ORDER BY is_archived ASC, next_run_at IS NULL, next_run_at ASC, created_at DESC'
      : 'SELECT * FROM reminders WHERE is_archived = 0 ORDER BY next_run_at IS NULL, next_run_at ASC, created_at DESC';

    const rows = await db.getAllAsync<ReminderRow>(query);
    return rows.map(mapReminder);
  }

  async getById(id: string): Promise<Reminder | null> {
    if (!id) return null;
    const db = await this.getDb();
    return this.getByIdWithDb(db, id);
  }

  async getDue(now: string = this.now().toISOString()): Promise<Reminder[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<ReminderRow>(
      `SELECT * FROM reminders
       WHERE is_archived = 0
         AND next_run_at IS NOT NULL
         AND next_run_at <= ?
       ORDER BY next_run_at ASC`,
      [now]
    );
    return rows.map(mapReminder);
  }

  async create(data: CreateReminderDTO): Promise<Reminder> {
    const db = await this.getDb();
    const normalized = await this.normalizeFields(db, {
      ...data,
      isArchived: false,
    });
    const now = this.now();
    const nowIso = now.toISOString();
    const nextRunAt = nextReminderRunAt(normalized, now);

    if (!nextRunAt) {
      throw new ReminderValidationError(
        'START_DATE_IN_PAST',
        'La fecha de inicio del recordatorio ya pasó.'
      );
    }

    const id = `rem_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.runAsync(
      `INSERT INTO reminders
         (id, title, type, description, amount, account_id, category_id,
          recurrence, time, start_date, next_run_at, is_archived,
          last_notified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
      [
        id,
        normalized.title,
        normalized.type,
        normalized.description,
        normalized.amount,
        normalized.accountId,
        normalized.categoryId,
        normalized.recurrence,
        normalized.time,
        normalized.startDate,
        nextRunAt,
        nowIso,
        nowIso,
      ]
    );

    return (await this.getByIdWithDb(db, id))!;
  }

  async update(id: string, data: UpdateReminderDTO): Promise<Reminder> {
    const db = await this.getDb();
    const existing = await this.getByIdWithDb(db, id);
    if (!existing) throw new Error(`Reminder not found: ${id}`);

    const fields: ReminderFields = {
      title: data.title !== undefined ? data.title : existing.title,
      type: data.type !== undefined ? data.type : existing.type,
      description:
        data.description !== undefined
          ? data.description
          : existing.description,
      amount: data.amount !== undefined ? data.amount : existing.amount,
      accountId:
        data.accountId !== undefined ? data.accountId : existing.accountId,
      categoryId:
        data.categoryId !== undefined ? data.categoryId : existing.categoryId,
      recurrence:
        data.recurrence !== undefined ? data.recurrence : existing.recurrence,
      time: data.time !== undefined ? data.time : existing.time,
      startDate:
        data.startDate !== undefined ? data.startDate : existing.startDate,
      isArchived:
        data.isArchived !== undefined ? data.isArchived : existing.isArchived,
    };

    const normalized = await this.normalizeFields(db, fields);
    const now = this.now();
    const scheduleChanged =
      data.recurrence !== undefined ||
      data.time !== undefined ||
      data.startDate !== undefined;
    const reactivated = existing.isArchived && !normalized.isArchived;
    const shouldRecompute =
      scheduleChanged ||
      reactivated ||
      (!normalized.isArchived &&
        !existing.nextRunAt &&
        existing.recurrence !== 'ONCE');

    let nextRunAt = existing.nextRunAt ?? null;
    if (shouldRecompute) {
      nextRunAt = nextReminderRunAt(normalized, now);

      if (!nextRunAt && !normalized.isArchived) {
        throw new ReminderValidationError(
          'START_DATE_IN_PAST',
          'La fecha de inicio del recordatorio ya pasó.'
        );
      }
    }

    await db.runAsync(
      `UPDATE reminders
       SET title = ?, type = ?, description = ?, amount = ?, account_id = ?,
           category_id = ?, recurrence = ?, time = ?, start_date = ?,
           next_run_at = ?, is_archived = ?, updated_at = ?
       WHERE id = ?`,
      [
        normalized.title,
        normalized.type,
        normalized.description,
        normalized.amount,
        normalized.accountId,
        normalized.categoryId,
        normalized.recurrence,
        normalized.time,
        normalized.startDate,
        nextRunAt,
        normalized.isArchived ? 1 : 0,
        now.toISOString(),
        id,
      ]
    );

    return (await this.getByIdWithDb(db, id))!;
  }

  async recordNotificationSent(
    id: string,
    sentAt?: string
  ): Promise<Reminder | null> {
    const db = await this.getDb();
    const existing = await this.getByIdWithDb(db, id);
    if (!existing) return null;

    const sentAtIso = sentAt ?? this.now().toISOString();
    if (!isIsoUtcTimestamp(sentAtIso)) {
      throw new ReminderValidationError(
        'SENT_AT_INVALID',
        'La fecha de envío de la notificación no es válida.'
      );
    }

    const isOneTime = existing.recurrence === 'ONCE';
    const nextRunAt = isOneTime
      ? null
      : nextReminderRunAt(existing, new Date(sentAtIso));

    if (!isOneTime && !nextRunAt) {
      throw new ReminderValidationError(
        'SCHEDULE_INVALID',
        'No se pudo calcular la próxima ejecución del recordatorio.'
      );
    }

    await db.runAsync(
      `UPDATE reminders
       SET next_run_at = ?, last_notified_at = ?, is_archived = ?, updated_at = ?
       WHERE id = ?`,
      [
        nextRunAt,
        sentAtIso,
        isOneTime ? 1 : existing.isArchived ? 1 : 0,
        this.now().toISOString(),
        id,
      ]
    );

    return this.getByIdWithDb(db, id);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
  }

  private async getByIdWithDb(
    db: ReminderDatabase,
    id: string
  ): Promise<Reminder | null> {
    const row = await db.getFirstAsync<ReminderRow>(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );
    return row ? mapReminder(row) : null;
  }

  private async normalizeFields(
    db: ReminderDatabase,
    fields: ReminderFields
  ): Promise<NormalizedReminderFields> {
    if (fields.type !== 'INCOME' && fields.type !== 'EXPENSE') {
      throw new ReminderValidationError(
        'TYPE_INVALID',
        'El tipo del recordatorio no es válido.'
      );
    }

    if (!RECURRENCES.includes(fields.recurrence)) {
      throw new ReminderValidationError(
        'RECURRENCE_INVALID',
        'La recurrencia del recordatorio no es válida.'
      );
    }

    const title = fields.title.trim();
    if (!title) {
      throw new ReminderValidationError(
        'TITLE_REQUIRED',
        'El título del recordatorio es obligatorio.'
      );
    }
    if (title.length > MAX_REMINDER_TITLE_LENGTH) {
      throw new ReminderValidationError(
        'TITLE_TOO_LONG',
        `El título no puede superar los ${MAX_REMINDER_TITLE_LENGTH} caracteres.`
      );
    }

    const description = fields.description?.trim() || null;
    if (
      description &&
      description.length > MAX_TRANSACTION_DESCRIPTION_LENGTH
    ) {
      throw new ReminderValidationError(
        'DESCRIPTION_TOO_LONG',
        `La descripción no puede superar los ${MAX_TRANSACTION_DESCRIPTION_LENGTH} caracteres.`
      );
    }

    const amount = fields.amount ?? null;
    if (
      amount !== null &&
      (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT)
    ) {
      throw new ReminderValidationError(
        'AMOUNT_INVALID',
        'El monto del recordatorio no es válido.'
      );
    }

    const time = fields.time.trim();
    if (!isValidReminderTime(time)) {
      throw new ReminderValidationError(
        'TIME_INVALID',
        'La hora del recordatorio no es válida.'
      );
    }

    const startDate = fields.startDate.trim();
    if (!isValidReminderDate(startDate)) {
      throw new ReminderValidationError(
        'START_DATE_INVALID',
        'La fecha de inicio del recordatorio no es válida.'
      );
    }

    const accountId = normalizeOptionalId(fields.accountId);
    const categoryId = normalizeOptionalId(fields.categoryId);

    await this.assertAccountExists(db, accountId);
    await this.assertCategoryExists(db, categoryId, fields.type);

    return {
      title,
      type: fields.type,
      description,
      amount,
      accountId,
      categoryId,
      recurrence: fields.recurrence,
      time,
      startDate,
      isArchived: fields.isArchived,
    };
  }

  private async assertAccountExists(
    db: ReminderDatabase,
    accountId: string | null
  ): Promise<void> {
    if (!accountId) return;

    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!row) {
      throw new ReminderValidationError(
        'ACCOUNT_NOT_FOUND',
        `La cuenta ${accountId} no existe.`
      );
    }
  }

  private async assertCategoryExists(
    db: ReminderDatabase,
    categoryId: string | null,
    type: ReminderType
  ): Promise<void> {
    if (!categoryId) return;

    const table = categoryTableForType(type);
    const row = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${table} WHERE id = ?`,
      [categoryId]
    );

    if (!row) {
      throw new ReminderValidationError(
        'CATEGORY_NOT_FOUND',
        `La categoría ${categoryId} no existe para recordatorios ${type}.`
      );
    }
  }
}
