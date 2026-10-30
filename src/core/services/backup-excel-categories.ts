import type { BackupCategory, BackupValidationError } from '../models/backup';
import type { CategoryType } from '../models/category';
import {
  categoryNameKey,
  isEmptyCell,
  parseCategoryType,
  parseExcelInteger,
} from './backup-excel-format';
import {
  getCell,
  getRowMeta,
  isRowEmpty,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  parseBooleanCell,
  pushName,
  uniqueId,
  type IdFactory,
  type ParsedCategories,
} from './backup-excel-shared';
import {
  addRowError,
  readMetaDate,
  readMetaString,
  rowText,
} from './backup-excel-values';

export function parseCategoryRows(
  table: ExcelSheetTable | null,
  errors: BackupValidationError[],
  now: string,
  nextId: IdFactory
): ParsedCategories {
  const incomeCategories: BackupCategory[] = [];
  const expenseCategories: BackupCategory[] = [];
  const byId = new Map<string, BackupCategory[]>();
  const byTypeAndName = new Map<string, BackupCategory[]>();
  if (!table) {
    return {
      incomeCategories,
      expenseCategories,
      index: { byId, byTypeAndName },
    };
  }

  const idsByType: Record<CategoryType, Set<string>> = {
    INCOME: new Set(),
    EXPENSE: new Set(),
  };

  for (const row of table.rows) {
    if (isRowEmpty(table, row)) continue;

    const typeLabel = rowText(table, row, 'type');
    const type = parseCategoryType(typeLabel);
    if (!type) {
      addRowError(errors, table, row, 'invalidCategoryType', 'type', {
        value: typeLabel,
      });
      continue;
    }

    const name = rowText(table, row, 'name');
    if (!name) {
      addRowError(errors, table, row, 'missingField', 'name', { path: 'name' });
      continue;
    }

    const color = rowText(table, row, 'color') || null;
    const icon = rowText(table, row, 'icon') || null;
    const isDefault = parseBooleanCell(
      table,
      row,
      'isDefault',
      errors,
      false
    );
    let sortOrder = 0;
    if (!isEmptyCell(getCell(table, row, 'sortOrder'))) {
      const parsed = parseExcelInteger(getCell(table, row, 'sortOrder'));
      if (parsed === null) {
        addRowError(errors, table, row, 'invalidValue', 'sortOrder', {
          path: 'sortOrder',
        });
      } else {
        sortOrder = parsed;
      }
    }

    const meta = getRowMeta(table, row, errors);
    const id = uniqueId(
      readMetaString(meta, 'id'),
      idsByType[type],
      type === 'INCOME' ? 'cat-inc' : 'cat-exp',
      table,
      row,
      errors,
      nextId
    );
    const createdAt =
      readMetaDate(meta, 'createdAt', table, row, errors) ?? now;

    const category: BackupCategory = {
      id,
      name,
      type,
      color,
      icon,
      isDefault,
      sortOrder,
      createdAt,
    };
    if (type === 'INCOME') {
      incomeCategories.push(category);
    } else {
      expenseCategories.push(category);
    }
    pushName(byId, id, category);
    pushName(byTypeAndName, categoryNameKey(type, name), category);
  }

  return {
    incomeCategories,
    expenseCategories,
    index: { byId, byTypeAndName },
  };
}
