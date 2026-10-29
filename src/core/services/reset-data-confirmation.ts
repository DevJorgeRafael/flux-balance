export function normalizeResetConfirmation(value: string): string {
  return value.trim().toUpperCase();
}

export function isResetConfirmationValid(value: string, expectedWord: string): boolean {
  const expected = normalizeResetConfirmation(expectedWord);
  return expected.length > 0 && normalizeResetConfirmation(value) === expected;
}
