import test from 'node:test';
import assert from 'node:assert/strict';

import { parseReminderAmount } from './reminder-amount.ts';

test('vacío y cero se guardan sin monto', () => {
  assert.deepEqual(parseReminderAmount('', 'es-ES', 2), {
    ok: true,
    value: null,
  });
  assert.deepEqual(parseReminderAmount('   ', 'es-ES', 2), {
    ok: true,
    value: null,
  });
  assert.deepEqual(parseReminderAmount('0', 'es-ES', 2), {
    ok: true,
    value: null,
  });
  assert.deepEqual(parseReminderAmount('0,00', 'es-ES', 2), {
    ok: true,
    value: null,
  });
});

test('conserva un monto positivo', () => {
  assert.deepEqual(parseReminderAmount('12,50', 'es-ES', 2), {
    ok: true,
    value: 12.5,
  });
});

test('rechaza montos negativos y texto inválido', () => {
  assert.deepEqual(parseReminderAmount('-1', 'es-ES', 2), {
    ok: false,
    error: 'negative',
  });
  assert.deepEqual(parseReminderAmount('abc', 'es-ES', 2), {
    ok: false,
    error: 'invalid',
  });
});
