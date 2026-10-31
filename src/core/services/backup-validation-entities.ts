import type { BackupValidationError } from '../models/backup';
import type { CategoryType } from '../models/category';
import {
  BACKUP_LIMITS,
  addError,
  checkArrayLimit,
  isOneOf,
  isRecord,
  registerId,
  requireAmount,
  requireArray,
  requireBoolean,
  requireDate,
  requireId,
  requireInteger,
  requireNullableAmount,
  requireNullableString,
  requirePositiveInteger,
  requireString,
  validateId,
} from './backup-validation-helpers';

const ACCOUNT_TYPES = ['CHECKING', 'FLEXIBLE_SAVINGS', 'FIXED_TERM'] as const;
const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER'] as const;
const DEPOSIT_STATUSES = ['ACTIVE', 'MATURED', 'CANCELLED'] as const;

function validateDeposit(
  value: unknown,
  path: string,
  errors: BackupValidationError[],
  parentAccountId: string | null,
  depositIds: Set<string>
): void {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', path);
    return;
  }

  registerId(
    requireId(value, 'id', `${path}.id`, errors),
    depositIds,
    `${path}.id`,
    errors
  );

  const accountId = requireId(
    value,
    'accountId',
    `${path}.accountId`,
    errors
  );
  if (accountId && parentAccountId && accountId !== parentAccountId) {
    addError(errors, 'invalidValue', `${path}.accountId`, {
      expected: parentAccountId,
      actual: accountId,
    });
  }

  requireAmount(value, 'principalAmount', `${path}.principalAmount`, errors);
  requireAmount(value, 'annualRate', `${path}.annualRate`, errors);
  requirePositiveInteger(value, 'termMonths', `${path}.termMonths`, errors);
  requireDate(value, 'startDate', `${path}.startDate`, errors);
  requireDate(value, 'maturityDate', `${path}.maturityDate`, errors);

  const status = requireString(value, 'status', `${path}.status`, errors);
  if (status && !isOneOf(status, DEPOSIT_STATUSES)) {
    addError(errors, 'invalidValue', `${path}.status`, { value: status });
  }

  requireDate(value, 'createdAt', `${path}.createdAt`, errors);
}

function validateAccount(
  value: unknown,
  path: string,
  errors: BackupValidationError[],
  accountIds: Set<string>,
  depositIds: Set<string>
): void {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', path);
    return;
  }

  const id = requireId(value, 'id', `${path}.id`, errors);
  registerId(id, accountIds, `${path}.id`, errors);

  requireString(value, 'name', `${path}.name`, errors);

  const type = requireString(value, 'type', `${path}.type`, errors);
  if (type && !isOneOf(type, ACCOUNT_TYPES)) {
    addError(errors, 'invalidValue', `${path}.type`, { value: type });
  }

  requireAmount(value, 'balance', `${path}.balance`, errors);
  requireString(value, 'currency', `${path}.currency`, errors);
  requireNullableAmount(value, 'annualRate', `${path}.annualRate`, errors);
  requireBoolean(value, 'isArchived', `${path}.isArchived`, errors);
  requireDate(value, 'createdAt', `${path}.createdAt`, errors);
  requireDate(value, 'updatedAt', `${path}.updatedAt`, errors);

  const deposits = requireArray(
    value,
    'fixedTermDeposits',
    `${path}.fixedTermDeposits`,
    errors
  );
  if (
    deposits &&
    checkArrayLimit(
      errors,
      `${path}.fixedTermDeposits`,
      deposits,
      BACKUP_LIMITS.depositsPerAccount
    )
  ) {
    deposits.forEach((deposit, index) => {
      validateDeposit(
        deposit,
        `${path}.fixedTermDeposits[${index}]`,
        errors,
        id,
        depositIds
      );
    });
  }
}

function validateCategoryList(
  value: unknown,
  expectedType: CategoryType,
  path: string,
  errors: BackupValidationError[],
  categoryIds: Set<string>
): void {
  if (!Array.isArray(value)) {
    addError(errors, 'invalidType', path);
    return;
  }
  if (
    !checkArrayLimit(errors, path, value, BACKUP_LIMITS.categoriesPerType)
  ) {
    return;
  }

  value.forEach((category, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(category)) {
      addError(errors, 'invalidType', itemPath);
      return;
    }

    registerId(
      requireId(category, 'id', `${itemPath}.id`, errors),
      categoryIds,
      `${itemPath}.id`,
      errors
    );
    requireString(category, 'name', `${itemPath}.name`, errors);

    const type = requireString(category, 'type', `${itemPath}.type`, errors);
    if (type && type !== expectedType) {
      addError(errors, 'invalidValue', `${itemPath}.type`, {
        expected: expectedType,
        actual: type,
      });
    }

    requireNullableString(category, 'color', `${itemPath}.color`, errors);
    requireNullableString(category, 'icon', `${itemPath}.icon`, errors);
    requireBoolean(category, 'isDefault', `${itemPath}.isDefault`, errors);
    requireInteger(category, 'sortOrder', `${itemPath}.sortOrder`, errors);
    requireDate(category, 'createdAt', `${itemPath}.createdAt`, errors);
  });
}

function validateTransactionSplit(
  value: unknown,
  path: string,
  errors: BackupValidationError[],
  parentTransactionId: string | null,
  parentType: string | null,
  accountIds: Set<string>,
  incomeCategoryIds: Set<string>,
  expenseCategoryIds: Set<string>,
  splitIds: Set<string>
): number | null {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', path);
    return null;
  }

  registerId(
    requireId(value, 'id', `${path}.id`, errors),
    splitIds,
    `${path}.id`,
    errors
  );

  const transactionId = requireId(
    value,
    'transactionId',
    `${path}.transactionId`,
    errors
  );
  if (
    transactionId &&
    parentTransactionId &&
    transactionId !== parentTransactionId
  ) {
    addError(errors, 'invalidValue', `${path}.transactionId`, {
      expected: parentTransactionId,
      actual: transactionId,
    });
  }

  const accountId = requireId(
    value,
    'accountId',
    `${path}.accountId`,
    errors
  );
  if (accountId && !accountIds.has(accountId)) {
    addError(errors, 'missingAccount', `${path}.accountId`, {
      id: accountId,
    });
  }

  const rawCategoryId = requireString(
    value,
    'categoryId',
    `${path}.categoryId`,
    errors,
    true
  );
  let categoryId: string | null = null;
  if (rawCategoryId !== null) {
    categoryId =
      rawCategoryId.length === 0
        ? ''
        : validateId(rawCategoryId, `${path}.categoryId`, errors);
  }
  if (categoryId) {
    if (parentType === 'INCOME' && !incomeCategoryIds.has(categoryId)) {
      addError(errors, 'missingCategory', `${path}.categoryId`, {
        id: categoryId,
        type: 'INCOME',
      });
    } else if (parentType === 'EXPENSE' && !expenseCategoryIds.has(categoryId)) {
      addError(errors, 'missingCategory', `${path}.categoryId`, {
        id: categoryId,
        type: 'EXPENSE',
      });
    }
  } else if (
    categoryId === '' &&
    (parentType === 'INCOME' || parentType === 'EXPENSE')
  ) {
    addError(errors, 'invalidValue', `${path}.categoryId`, {
      expected: 'non-empty category id',
      actual: '',
    });
  }

  const amount = requireAmount(value, 'amount', `${path}.amount`, errors);
  requireNullableString(value, 'notes', `${path}.notes`, errors);
  return amount;
}

function validateTransaction(
  value: unknown,
  path: string,
  errors: BackupValidationError[],
  accountIds: Set<string>,
  incomeCategoryIds: Set<string>,
  expenseCategoryIds: Set<string>,
  transactionIds: Set<string>,
  splitIds: Set<string>,
  currencyDecimals: number
): void {
  if (!isRecord(value)) {
    addError(errors, 'invalidType', path);
    return;
  }

  const id = requireId(value, 'id', `${path}.id`, errors);
  registerId(id, transactionIds, `${path}.id`, errors);

  const type = requireString(value, 'type', `${path}.type`, errors);
  if (type && !isOneOf(type, TRANSACTION_TYPES)) {
    addError(errors, 'invalidValue', `${path}.type`, { value: type });
  }

  const totalAmount = requireAmount(
    value,
    'totalAmount',
    `${path}.totalAmount`,
    errors
  );
  requireNullableString(value, 'description', `${path}.description`, errors);
  requireDate(value, 'date', `${path}.date`, errors);
  requireDate(value, 'createdAt', `${path}.createdAt`, errors);

  const splits = requireArray(value, 'splits', `${path}.splits`, errors);
  const splitsWithinLimit = Boolean(
    splits &&
      checkArrayLimit(
        errors,
        `${path}.splits`,
        splits,
        BACKUP_LIMITS.splitsPerTransaction
      )
  );
  let splitTotal = 0;
  let splitAmountsValid = true;
  if (splits && splitsWithinLimit) {
    splits.forEach((split, index) => {
      const amount = validateTransactionSplit(
        split,
        `${path}.splits[${index}]`,
        errors,
        id,
        type,
        accountIds,
        incomeCategoryIds,
        expenseCategoryIds,
        splitIds
      );
      if (amount === null) {
        splitAmountsValid = false;
      } else {
        splitTotal += amount;
      }
    });
  }

  if (
    splits &&
    splitsWithinLimit &&
    splits.length > 0 &&
    totalAmount !== null &&
    splitAmountsValid
  ) {
    const tolerance = 0.5 * 10 ** -currencyDecimals + 1e-9;
    if (Math.abs(splitTotal - totalAmount) > tolerance) {
      addError(errors, 'invalidSplitTotal', `${path}.splits`, {
        expected: totalAmount,
        actual: splitTotal,
      });
    }
  }
}

export {
  validateAccount,
  validateCategoryList,
  validateTransaction,
};
