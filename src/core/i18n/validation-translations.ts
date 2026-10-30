export const validationTranslations = {
  es: {
    amountInputRequired: 'Ingresa un monto.',
    amountInputInvalid: 'Ingresa un monto válido.',
    amountInputNegative: 'El monto no puede ser negativo.',
    amountInputZero: 'El monto debe ser mayor que cero.',
    amountInputTooManyDecimals: 'Usa como máximo {{decimals}} decimales.',
    amountInputTooLarge: 'El monto no puede superar {{max}}.',
    noAccountsForMovement:
      'Debes crear una cuenta antes de registrar un movimiento.',
    createTransactionError: 'No se pudo guardar el movimiento.',
    accountNameRequired: 'Por favor ingresa un nombre para la cuenta.',
    accountNameTooLong: 'El nombre no puede superar {{max}} caracteres.',
    accountCapitalRequired: 'El capital debe ser mayor que cero.',
    annualRateInvalid: 'Ingresa una TNA válida entre 0 y {{max}}.',
    termMonthsInvalid:
      'El plazo debe ser un entero entre 1 y {{max}} meses.',
    createAccountError: 'No se pudo crear la cuenta.',
    backupErrorInvalidId: 'El id en "{{path}}" no es válido: {{id}}.',
    backupErrorInvalidSplitTotal:
      'La suma de las partes ({{actual}}) no coincide con el total ({{expected}}) en "{{path}}".',
    backupErrorTooManyItems:
      'El archivo supera el límite de {{limit}} elementos en "{{path}}" ({{count}}).',
  },
  en: {
    amountInputRequired: 'Enter an amount.',
    amountInputInvalid: 'Enter a valid amount.',
    amountInputNegative: 'The amount cannot be negative.',
    amountInputZero: 'The amount must be greater than zero.',
    amountInputTooManyDecimals: 'Use at most {{decimals}} decimals.',
    amountInputTooLarge: 'The amount cannot exceed {{max}}.',
    noAccountsForMovement:
      'Create an account before recording a movement.',
    createTransactionError: 'The movement could not be saved.',
    accountNameRequired: 'Enter a name for the account.',
    accountNameTooLong: 'The name cannot exceed {{max}} characters.',
    accountCapitalRequired: 'The capital must be greater than zero.',
    annualRateInvalid: 'Enter a valid APR between 0 and {{max}}.',
    termMonthsInvalid:
      'The term must be an integer between 1 and {{max}} months.',
    createAccountError: 'The account could not be created.',
    backupErrorInvalidId: 'The id in "{{path}}" is not valid: {{id}}.',
    backupErrorInvalidSplitTotal:
      'The sum of splits ({{actual}}) does not match the total ({{expected}}) in "{{path}}".',
    backupErrorTooManyItems:
      'The file exceeds the limit of {{limit}} items in "{{path}}" ({{count}}).',
  },
} as const;
