import { isSupportedCurrency } from '../constants/currencies';
import type {
  BackupAccount,
  BackupFixedTermDeposit,
  BackupValidationError,
} from '../models/backup';
import {
  isEmptyCell,
  parseAccountType,
  parseDepositStatus,
  parseExcelInteger,
} from './backup-excel-format';
import {
  getCell,
  getRowMeta,
  isRowEmpty,
  type ExcelRow,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  parseBooleanCell,
  parseOptionalRate,
  parseRequiredAmount,
  parseRequiredRate,
  pushName,
  uniqueId,
  type IdFactory,
  type ParsedAccounts,
} from './backup-excel-shared';
import {
  addRowError,
  readMetaDate,
  readMetaString,
  rowDate,
  rowNumberValue,
  rowText,
} from './backup-excel-values';

export function parseAccountRows(
  table: ExcelSheetTable | null,
  errors: BackupValidationError[],
  now: string,
  nextId: IdFactory
): ParsedAccounts {
  const accounts: BackupAccount[] = [];
  const byId = new Map<string, BackupAccount>();
  const byName = new Map<string, BackupAccount[]>();
  if (!table) return { accounts, index: { byId, byName } };

  const accountIds = new Set<string>();
  const depositRows: ExcelRow[] = [];

  for (const row of table.rows) {
    if (isRowEmpty(table, row)) continue;

    const typeLabel = rowText(table, row, 'type');
    if (!typeLabel) {
      addRowError(errors, table, row, 'missingField', 'type', { path: 'type' });
      continue;
    }

    const type = parseAccountType(typeLabel);
    if (!type) {
      addRowError(errors, table, row, 'invalidAccountType', 'type', {
        value: typeLabel,
      });
      continue;
    }
    if (type === 'DEPOSIT') {
      depositRows.push(row);
      continue;
    }

    const name = rowText(table, row, 'name');
    if (!name) {
      addRowError(errors, table, row, 'missingField', 'name', { path: 'name' });
      continue;
    }

    const balance = parseRequiredAmount(
      table,
      row,
      'balance',
      errors,
      false
    );
    const currency = rowText(table, row, 'currency');
    if (!currency) {
      addRowError(errors, table, row, 'missingField', 'currency', {
        path: 'currency',
      });
    } else if (!isSupportedCurrency(currency)) {
      addRowError(errors, table, row, 'invalidCurrency', 'currency', {
        currency,
      });
    }

    const annualRate = parseOptionalRate(
      table,
      row,
      'annualRate',
      errors
    );
    const isArchived = parseBooleanCell(
      table,
      row,
      'archived',
      errors,
      false
    );
    const meta = getRowMeta(table, row, errors);
    const id = uniqueId(
      readMetaString(meta, 'id'),
      accountIds,
      'acc',
      table,
      row,
      errors,
      nextId
    );
    const createdAt =
      readMetaDate(meta, 'createdAt', table, row, errors) ?? now;
    const updatedAt =
      readMetaDate(meta, 'updatedAt', table, row, errors) ?? createdAt;

    if (balance === null) continue;

    const account: BackupAccount = {
      id,
      name,
      type,
      balance,
      currency: currency || 'USD',
      annualRate,
      isArchived,
      createdAt,
      updatedAt,
      fixedTermDeposits: [],
    };
    accounts.push(account);
    byId.set(id, account);
    pushName(byName, name, account);
  }

  const depositIds = new Set<string>();
  for (const row of depositRows) {
    const name = rowText(table, row, 'name');
    if (!name) {
      addRowError(errors, table, row, 'missingField', 'name', { path: 'name' });
      continue;
    }

    const meta = getRowMeta(table, row, errors);
    const accountIdMeta = readMetaString(meta, 'accountId');
    let account: BackupAccount | undefined;
    if (accountIdMeta) {
      account = byId.get(accountIdMeta);
      if (!account) {
        addRowError(errors, table, row, 'unknownAccount', 'name', {
          name: accountIdMeta,
        });
      }
    } else {
      const matches = byName.get(name) ?? [];
      if (matches.length === 0) {
        addRowError(errors, table, row, 'unknownAccount', 'name', { name });
      } else if (matches.length > 1) {
        addRowError(errors, table, row, 'duplicateName', 'name', { name });
      } else {
        account = matches[0];
      }
    }
    if (!account) continue;

    if (account.type !== 'FIXED_TERM') {
      addRowError(errors, table, row, 'invalidValue', 'type', {
        path: 'type',
      });
      continue;
    }

    const principalAmount = parseRequiredAmount(
      table,
      row,
      'principal',
      errors,
      true
    );
    const annualRate = parseRequiredRate(
      table,
      row,
      'annualRate',
      errors
    );
    const termMonthsValue = rowNumberValue(table, row, 'termMonths');
    const termMonths = parseExcelInteger(
      getCell(table, row, 'termMonths')
    );
    if (isEmptyCell(getCell(table, row, 'termMonths'))) {
      addRowError(errors, table, row, 'missingField', 'termMonths', {
        path: 'termMonths',
      });
    } else if (termMonths === null || termMonths <= 0) {
      addRowError(errors, table, row, 'invalidTerm', 'termMonths', {
        value: String(termMonthsValue ?? ''),
      });
    }

    const startDate = rowDate(table, row, 'startDate', errors);
    const maturityDate = rowDate(table, row, 'maturityDate', errors);
    const statusLabel = rowText(table, row, 'status');
    const status = parseDepositStatus(statusLabel);
    if (!statusLabel) {
      addRowError(errors, table, row, 'missingField', 'status', {
        path: 'status',
      });
    } else if (!status) {
      addRowError(errors, table, row, 'invalidStatus', 'status', {
        value: statusLabel,
      });
    }

    if (
      principalAmount === null ||
      annualRate === null ||
      termMonths === null ||
      termMonths <= 0 ||
      !startDate ||
      !maturityDate ||
      !status
    ) {
      continue;
    }

    const depositId = uniqueId(
      readMetaString(meta, 'id'),
      depositIds,
      'dep',
      table,
      row,
      errors,
      nextId
    );
    const createdAt =
      readMetaDate(meta, 'createdAt', table, row, errors) ?? now;
    const startIso =
      readMetaDate(meta, 'startDate', table, row, errors) ??
      startDate.isoDate;
    const maturityIso =
      readMetaDate(meta, 'maturityDate', table, row, errors) ??
      maturityDate.isoDate;
    const deposit: BackupFixedTermDeposit = {
      id: depositId,
      accountId: account.id,
      principalAmount,
      annualRate,
      termMonths,
      startDate: startIso,
      maturityDate: maturityIso,
      status,
      createdAt,
    };
    account.fixedTermDeposits.push(deposit);
  }

  return { accounts, index: { byId, byName } };
}
