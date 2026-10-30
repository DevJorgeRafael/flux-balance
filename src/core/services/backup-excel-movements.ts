import type {
  BackupAccount,
  BackupCategory,
  BackupTransaction,
  BackupTransactionSplit,
  BackupValidationError,
} from '../models/backup';
import type { TransactionType } from '../models/transaction';
import {
  categoryNameKey,
  isEmptyCell,
  parseTransactionType,
} from './backup-excel-format';
import type { AccountIndex, CategoryIndex } from './backup-excel-shared';
import {
  getCell,
  getRowMeta,
  isRowEmpty,
  type ExcelRow,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  addRowError,
  chooseIsoDate,
  readMetaDate,
  readMetaString,
  rowDate,
  rowNumberValue,
  rowText,
  type ExcelDateValue,
} from './backup-excel-values';

interface MovementDraft {
  row: ExcelRow;
  type: TransactionType;
  date: ExcelDateValue;
  transactionDate: string;
  accountName: string;
  accountIdMeta: string | null;
  categoryName: string;
  categoryIdMeta: string | null;
  description: string;
  amount: number;
  transactionId: string;
  splitId: string | null;
  createdAt: string;
  notes: string | null;
  noSplit: boolean;
}

function hasMetaKey(
  meta: Record<string, unknown> | null,
  key: string
): boolean {
  return Boolean(
    meta && Object.prototype.hasOwnProperty.call(meta, key)
  );
}

function parseAmount(
  table: ExcelSheetTable,
  row: ExcelRow,
  errors: BackupValidationError[]
): number | null {
  if (isEmptyCell(getCell(table, row, 'amount'))) {
    addRowError(errors, table, row, 'missingField', 'amount', {
      path: 'amount',
    });
    return null;
  }
  const amount = rowNumberValue(table, row, 'amount');
  if (amount === null) {
    addRowError(errors, table, row, 'invalidAmount', 'amount', {
      path: 'amount',
    });
    return null;
  }
  if (amount <= 0) {
    addRowError(errors, table, row, 'invalidPositiveAmount', 'amount', {
      path: 'amount',
    });
    return null;
  }
  return amount;
}

function parseDraft(
  table: ExcelSheetTable,
  row: ExcelRow,
  errors: BackupValidationError[],
  now: string,
  nextId: (prefix: string) => string
): MovementDraft | null {
  const typeLabel = rowText(table, row, 'type');
  const type = parseTransactionType(typeLabel);
  if (!type) {
    addRowError(errors, table, row, 'invalidTransactionType', 'type', {
      value: typeLabel,
    });
    return null;
  }

  const date = rowDate(table, row, 'date', errors);
  if (!date) return null;

  const amount = parseAmount(table, row, errors);
  if (amount === null) return null;

  const meta = getRowMeta(table, row, errors);
  const accountName = rowText(table, row, 'account');
  const categoryName = rowText(table, row, 'category');
  const accountIdMeta = readMetaString(meta, 'accountId');
  const categoryIdMeta = readMetaString(meta, 'categoryId');
  const hasSplitId = hasMetaKey(meta, 'splitId');
  const splitId = hasSplitId
    ? readMetaString(meta, 'splitId')
    : nextId('split');
  const noSplit =
    (meta?.noSplit === true && !accountName && !categoryName) ||
    (hasSplitId && splitId === null && !accountName && !categoryName);

  if (!noSplit && !accountIdMeta && !accountName) {
    addRowError(errors, table, row, 'missingField', 'account', {
      path: 'account',
    });
  }
  if (
    !noSplit &&
    type !== 'TRANSFER' &&
    !categoryIdMeta &&
    !categoryName
  ) {
    addRowError(errors, table, row, 'missingField', 'category', {
      path: 'category',
    });
  }

  const transactionId =
    readMetaString(meta, 'transactionId') ?? nextId('tx');
  const transactionDate = chooseIsoDate(
    date,
    readMetaString(meta, 'transactionDate')
  );
  const createdAt =
    readMetaDate(meta, 'transactionCreatedAt', table, row, errors) ?? now;

  return {
    row,
    type,
    date,
    transactionDate,
    accountName,
    accountIdMeta,
    categoryName,
    categoryIdMeta,
    description: rowText(table, row, 'description'),
    amount,
    transactionId,
    splitId,
    createdAt,
    notes: readMetaString(meta, 'splitNotes'),
    noSplit,
  };
}

function resolveAccount(
  table: ExcelSheetTable,
  draft: MovementDraft,
  accounts: AccountIndex,
  errors: BackupValidationError[]
): BackupAccount | null {
  if (draft.accountIdMeta) {
    const account = accounts.byId.get(draft.accountIdMeta);
    if (account) return account;
    addRowError(errors, table, draft.row, 'unknownAccount', 'account', {
      name: draft.accountName || draft.accountIdMeta,
    });
    return null;
  }

  const matches = accounts.byName.get(draft.accountName) ?? [];
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    addRowError(errors, table, draft.row, 'duplicateName', 'account', {
      name: draft.accountName,
    });
  } else {
    addRowError(errors, table, draft.row, 'unknownAccount', 'account', {
      name: draft.accountName,
    });
  }
  return null;
}

function findCategoryById(
  categories: CategoryIndex,
  id: string,
  type?: TransactionType
): BackupCategory | null {
  const matches = categories.byId.get(id) ?? [];
  if (type && type !== 'TRANSFER') {
    return matches.find((category) => category.type === type) ?? null;
  }
  return matches[0] ?? null;
}

function findCategoryByName(
  categories: CategoryIndex,
  name: string,
  type: TransactionType
): BackupCategory[] {
  if (type !== 'TRANSFER') {
    return categories.byTypeAndName.get(categoryNameKey(type, name)) ?? [];
  }
  return [
    ...(categories.byTypeAndName.get(categoryNameKey('INCOME', name)) ?? []),
    ...(categories.byTypeAndName.get(categoryNameKey('EXPENSE', name)) ?? []),
  ];
}

function resolveCategory(
  table: ExcelSheetTable,
  draft: MovementDraft,
  categories: CategoryIndex,
  errors: BackupValidationError[]
): string | null {
  if (draft.categoryIdMeta) {
    const category = findCategoryById(
      categories,
      draft.categoryIdMeta,
      draft.type
    );
    if (category) return category.id;
    if (draft.type === 'TRANSFER') return draft.categoryIdMeta;
    addRowError(errors, table, draft.row, 'unknownCategory', 'category', {
      name: draft.categoryName || draft.categoryIdMeta,
      type: draft.type,
    });
    return null;
  }

  if (!draft.categoryName) {
    if (draft.type === 'TRANSFER') return '';
    return null;
  }

  const matches = findCategoryByName(
    categories,
    draft.categoryName,
    draft.type
  );
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    addRowError(errors, table, draft.row, 'duplicateName', 'category', {
      name: draft.categoryName,
    });
  } else {
    addRowError(errors, table, draft.row, 'unknownCategory', 'category', {
      name: draft.categoryName,
      type: draft.type,
    });
  }
  return null;
}

function addGroupError(
  errors: BackupValidationError[],
  table: ExcelSheetTable,
  draft: MovementDraft,
  column: string,
  expected: string,
  actual: string
): void {
  addRowError(errors, table, draft.row, 'invalidValue', column, {
    path: column,
    expected,
    actual,
  });
}

export function parseMovementRows(
  table: ExcelSheetTable,
  accounts: AccountIndex,
  categories: CategoryIndex,
  errors: BackupValidationError[],
  now: string,
  nextId: (prefix: string) => string
): BackupTransaction[] {
  const groups = new Map<string, MovementDraft[]>();

  for (const row of table.rows) {
    if (isRowEmpty(table, row)) continue;
    const draft = parseDraft(table, row, errors, now, nextId);
    if (!draft) continue;
    const drafts = groups.get(draft.transactionId) ?? [];
    drafts.push(draft);
    groups.set(draft.transactionId, drafts);
  }

  const transactions: BackupTransaction[] = [];
  const splitIds = new Set<string>();

  for (const drafts of groups.values()) {
    const first = drafts[0];
    for (const draft of drafts.slice(1)) {
      if (draft.type !== first.type) {
        addGroupError(errors, table, draft, 'type', first.type, draft.type);
      }
      if (Math.abs(draft.date.serial - first.date.serial) > 1e-9) {
        addGroupError(
          errors,
          table,
          draft,
          'date',
          first.date.isoDateTime,
          draft.date.isoDateTime
        );
      }
      if (draft.description !== first.description) {
        addGroupError(
          errors,
          table,
          draft,
          'description',
          first.description,
          draft.description
        );
      }
      if (draft.noSplit || first.noSplit) {
        addGroupError(errors, table, draft, 'type', 'split', 'no split');
      }
    }

    const splits: BackupTransactionSplit[] = [];
    if (!first.noSplit) {
      for (const draft of drafts) {
        const account = resolveAccount(table, draft, accounts, errors);
        const categoryId = resolveCategory(table, draft, categories, errors);
        if (!account || categoryId === null) continue;

        let splitId = draft.splitId ?? nextId('split');
        if (splitIds.has(splitId)) {
          addRowError(errors, table, draft.row, 'duplicateId', 'meta', {
            id: splitId,
          });
          splitId = nextId('split');
        }
        splitIds.add(splitId);

        splits.push({
          id: splitId,
          transactionId: first.transactionId,
          accountId: account.id,
          categoryId,
          amount: draft.amount,
          notes: draft.notes,
        });
      }
    }

    if (!first.noSplit && splits.length === 0) continue;

    transactions.push({
      id: first.transactionId,
      type: first.type,
      totalAmount: first.noSplit
        ? first.amount
        : splits.reduce((total, split) => total + split.amount, 0),
      description: first.description || null,
      date: first.transactionDate,
      createdAt: first.createdAt,
      splits,
    });
  }

  return transactions;
}
