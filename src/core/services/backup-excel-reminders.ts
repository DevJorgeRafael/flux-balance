import type {
  BackupReminder,
  BackupValidationError,
} from '../models/backup';
import {
  parseRecurrence,
  parseTransactionType,
} from './backup-excel-format';
import {
  getCell,
  getRowMeta,
  isRowEmpty,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  createIdFactory,
  readMetaString,
} from './backup-excel-values';

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function parseReminderRows(
  table: ExcelSheetTable | null,
  errors: BackupValidationError[],
  now: string
): BackupReminder[] {
  if (!table) return [];

  const nextId = createIdFactory(now);
  const reminders: BackupReminder[] = [];

  for (const row of table.rows) {
    if (isRowEmpty(table, row)) continue;

    const meta = getRowMeta(table, row, errors);
    const title = stringValue(
      meta?.title ?? getCell(table, row, 'title'),
      ''
    );
    const type =
      parseTransactionType(meta?.type ?? getCell(table, row, 'type')) ??
      'EXPENSE';
    const recurrence =
      parseRecurrence(
        meta?.recurrence ?? getCell(table, row, 'recurrence')
      ) ?? 'ONCE';
    const time = stringValue(meta?.time ?? getCell(table, row, 'time'), '09:00');
    const amountValue = meta?.amount ?? getCell(table, row, 'amount');
    const amount =
      typeof amountValue === 'number' && Number.isFinite(amountValue)
        ? amountValue
        : null;
    const startDate = stringValue(
      meta?.startDate ?? readMetaString(meta, 'startDate') ?? '',
      ''
    );

    reminders.push({
      id: stringValue(meta?.id, nextId('rem')),
      title,
      type: type === 'TRANSFER' ? 'EXPENSE' : type,
      description: nullableString(meta?.description),
      amount,
      accountId: nullableString(meta?.accountId),
      categoryId: nullableString(meta?.categoryId),
      recurrence: recurrence as BackupReminder['recurrence'],
      time,
      startDate,
      nextRunAt: nullableString(meta?.nextRunAt),
      isArchived: meta?.isArchived === true,
      lastNotifiedAt: nullableString(meta?.lastNotifiedAt),
      createdAt: stringValue(meta?.createdAt, now),
      updatedAt: stringValue(meta?.updatedAt, now),
    });
  }

  return reminders;
}
