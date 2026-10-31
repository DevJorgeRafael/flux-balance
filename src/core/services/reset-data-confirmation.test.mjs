import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isResetConfirmationValid,
  normalizeResetConfirmation,
} from './reset-data-confirmation.ts';

test('normaliza la palabra de confirmación sin espacios ni mayúsculas', () => {
  assert.equal(normalizeResetConfirmation('  borrar  '), 'BORRAR');
  assert.equal(normalizeResetConfirmation('Delete'), 'DELETE');
});

test('acepta la palabra exacta en español y en inglés', () => {
  assert.equal(isResetConfirmationValid('BORRAR', 'BORRAR'), true);
  assert.equal(isResetConfirmationValid('  borrar  ', 'BORRAR'), true);
  assert.equal(isResetConfirmationValid('DELETE', 'DELETE'), true);
  assert.equal(isResetConfirmationValid('delete', 'DELETE'), true);
});

test('rechaza palabras vacías, incompletas o distintas', () => {
  assert.equal(isResetConfirmationValid('', 'BORRAR'), false);
  assert.equal(isResetConfirmationValid('BORRA', 'BORRAR'), false);
  assert.equal(isResetConfirmationValid('DELETE', 'BORRAR'), false);
  assert.equal(isResetConfirmationValid('BORRAR', ''), false);
});
