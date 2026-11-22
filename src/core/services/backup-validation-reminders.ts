import {
  LANGUAGE_PREFERENCES,
  THEME_PREFERENCES,
} from '../preferences/preferences';
import type {
  BackupPreferences,
  BackupReminder,
  BackupValidationError,
} from '../models/backup';
import type { UnknownRecord } from './backup-validation-helpers';
import {
  BACKUP_LIMITS,
  addError,
  checkArrayLimit,
  hasOwn,
  isRecord,
  isValidBackupId,
  isValidDateString,
  registerId,
  requireBoolean,
  requireDate,
  requireId,
  requireNullableString,
  requireString,
} from './backup-validation-helpers';

const RECURRENCES = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;
const TYPES = ['INCOME', 'EXPENSE'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ReminderValidationContext {
  accountIds: Set<string>;
  incomeCategoryIds: Set<string>;
  expenseCategoryIds: Set<string>;
}

function nullableDate(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): string | null {
  if (!hasOwn(value, key)) {
    addError(errors, 'missingField', path);
    return null;
  }
  const field = value[key];
  if (field === null) return null;
  if (!isValidDateString(field)) {
    addError(errors, 'invalidDate', path);
    return null;
  }
  return field;
}

function nullableAmount(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  if (!hasOwn(value, key)) {
    addError(errors, 'missingField', path);
    return null;
  }
  const field = value[key];
  if (field === null) return null;
  if (typeof field !== 'number' || !Number.isFinite(field) || field <= 0) {
    addError(errors, 'invalidAmount', path);
    return null;
  }
  return field;
}

function optionalReference(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[],
  knownIds: Set<string>
): string | null {
  const reference = requireNullableString(value, key, path, errors);
  if (!reference) return null;
  if (!isValidBackupId(reference)) {
    addError(errors, 'invalidId', path, { id: reference });
    return null;
  }
  if (!knownIds.has(reference)) {
    addError(
      errors,
      key === 'accountId' ? 'unknownAccount' : 'unknownCategory',
      path,
      { id: reference }
    );
  }
  return reference;
}

function validateReminder(
  value: unknown,
  path: string,
  errors: BackupValidationError[],
  context: ReminderValidationContext,
  reminderIds: Set<string>
): BackupReminder | null {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', path);
    return null;
  }

  const id = requireId(value, 'id', `${path}.id`, errors);
  registerId(id, reminderIds, `${path}.id`, errors);

  const title = requireString(value, 'title', `${path}.title`, errors);
  if (title && title.length > 80) {
    addError(errors, 'invalidValue', `${path}.title`);
  }

  const type = requireString(value, 'type', `${path}.type`, errors);
  if (type && !(TYPES as readonly string[]).includes(type)) {
    addError(errors, 'invalidType', `${path}.type`);
  }

  const description = requireNullableString(
    value,
    'description',
    `${path}.description`,
    errors
  );
  if (description && description.length > 200) {
    addError(errors, 'invalidValue', `${path}.description`);
  }

  const amount = nullableAmount(value, 'amount', `${path}.amount`, errors);

  const categories =
    type === 'INCOME' ? context.incomeCategoryIds : context.expenseCategoryIds;
  const accountId = optionalReference(
    value,
    'accountId',
    `${path}.accountId`,
    errors,
    context.accountIds
  );
  const categoryId = optionalReference(
    value,
    'categoryId',
    `${path}.categoryId`,
    errors,
    categories
  );

  const recurrence = requireString(
    value,
    'recurrence',
    `${path}.recurrence`,
    errors
  );
  if (recurrence && !(RECURRENCES as readonly string[]).includes(recurrence)) {
    addError(errors, 'invalidValue', `${path}.recurrence`);
  }

  const time = requireString(value, 'time', `${path}.time`, errors);
  if (time && !TIME_PATTERN.test(time)) {
    addError(errors, 'invalidValue', `${path}.time`);
  }

  const startDate = requireDate(value, 'startDate', `${path}.startDate`, errors);
  const nextRunAt = nullableDate(value, 'nextRunAt', `${path}.nextRunAt`, errors);
  const lastNotifiedAt = nullableDate(
    value,
    'lastNotifiedAt',
    `${path}.lastNotifiedAt`,
    errors
  );
  const isArchived = requireBoolean(
    value,
    'isArchived',
    `${path}.isArchived`,
    errors
  );
  const createdAt = requireDate(value, 'createdAt', `${path}.createdAt`, errors);
  const updatedAt = requireDate(value, 'updatedAt', `${path}.updatedAt`, errors);

  if (
    isArchived === false &&
    nextRunAt === null &&
    recurrence !== 'ONCE'
  ) {
    addError(errors, 'invalidValue', `${path}.nextRunAt`);
  }

  if (
    !id ||
    !title ||
    !type ||
    !recurrence ||
    !time ||
    !startDate ||
    isArchived === null ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    title,
    type: type as BackupReminder['type'],
    description,
    amount,
    accountId,
    categoryId,
    recurrence: recurrence as BackupReminder['recurrence'],
    time,
    startDate,
    nextRunAt,
    isArchived,
    lastNotifiedAt,
    createdAt,
    updatedAt,
  };
}

export function validateReminderList(
  reminders: unknown[] | null,
  errors: BackupValidationError[],
  context: ReminderValidationContext
): BackupReminder[] {
  if (!reminders) return [];
  if (!checkArrayLimit(errors, 'reminders', reminders, BACKUP_LIMITS.reminders)) {
    return [];
  }

  const reminderIds = new Set<string>();
  const validated: BackupReminder[] = [];
  reminders.forEach((reminder, index) => {
    const result = validateReminder(
      reminder,
      `reminders[${index}]`,
      errors,
      context,
      reminderIds
    );
    if (result) validated.push(result);
  });
  return validated;
}

export function validateBackupPreferences(
  value: unknown,
  errors: BackupValidationError[]
): BackupPreferences | null {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', 'preferences');
    return null;
  }

  const theme = requireString(value, 'theme', 'preferences.theme', errors);
  if (theme && !(THEME_PREFERENCES as readonly string[]).includes(theme)) {
    addError(errors, 'invalidValue', 'preferences.theme');
  }
  const language = requireString(
    value,
    'language',
    'preferences.language',
    errors
  );
  if (
    language &&
    !(LANGUAGE_PREFERENCES as readonly string[]).includes(language)
  ) {
    addError(errors, 'invalidValue', 'preferences.language');
  }

  if (!theme || !language) return null;
  return {
    theme: theme as BackupPreferences['theme'],
    language: language as BackupPreferences['language'],
  };
}
