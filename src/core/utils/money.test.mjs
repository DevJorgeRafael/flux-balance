import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, parseAmountInput } from './money.ts';

const ES = 'es-ES';
const EN = 'en-US';

test('formats USD in Spanish with dot thousands and comma decimals', () => {
  assert.equal(formatMoney(1798511.11, 'USD', ES), 'USD 1.798.511,11');
});

test('formats USD in English with comma thousands and dot decimals', () => {
  assert.equal(formatMoney(1798511.11, 'USD', EN), 'USD 1,798,511.11');
});

test('formats EUR in Spanish', () => {
  assert.equal(formatMoney(1234.5, 'EUR', ES), 'EUR 1.234,50');
});

test('formats EUR in English', () => {
  assert.equal(formatMoney(1234.5, 'EUR', EN), 'EUR 1,234.50');
});

test('keeps the minus sign before the currency code', () => {
  assert.equal(formatMoney(-84500, 'USD', ES), '-USD 84.500,00');
  assert.equal(formatMoney(-84500, 'EUR', EN), '-EUR 84,500.00');
});

test('adds the plus sign when requested', () => {
  assert.equal(formatMoney(10, 'USD', ES, { showSign: true }), '+USD 10,00');
  assert.equal(formatMoney(10, 'EUR', EN, { showSign: true }), '+EUR 10.00');
});

test('does not add a plus sign by default', () => {
  assert.equal(formatMoney(10, 'USD', ES), 'USD 10,00');
});

test('formats zero without a sign', () => {
  assert.equal(formatMoney(0, 'USD', ES), 'USD 0,00');
  assert.equal(formatMoney(0, 'USD', ES, { showSign: true }), 'USD 0,00');
});

test('formats JPY and CLP without decimals', () => {
  assert.equal(formatMoney(1234, 'JPY', EN), 'JPY 1,234');
  assert.equal(formatMoney(1234.56, 'JPY', EN), 'JPY 1,235');
  assert.equal(formatMoney(1234, 'CLP', ES), 'CLP 1.234');
});

test('falls back to USD for unknown currencies', () => {
  assert.equal(formatMoney(10, 'XYZ', ES), 'USD 10,00');
  assert.equal(formatMoney(10, '', ES), 'USD 10,00');
});

test('omits the currency code when it is not requested', () => {
  assert.equal(formatMoney(1234.5, 'USD', ES, { showCurrency: false }), '1.234,50');
  assert.equal(formatMoney(1234.5, 'COP', ES, { showCurrency: false }), '1.234,50');
  assert.equal(formatMoney(1234.5, 'EUR', EN, { showCurrency: false }), '1,234.50');
});

test('keeps the sign when the currency code is omitted', () => {
  assert.equal(formatMoney(-84500, 'USD', ES, { showCurrency: false }), '-84.500,00');
  assert.equal(
    formatMoney(10, 'USD', ES, { showSign: true, showCurrency: false }),
    '+10,00'
  );
});

test('formats large amounts', () => {
  assert.equal(formatMoney(9876543210.99, 'USD', EN), 'USD 9,876,543,210.99');
  assert.equal(formatMoney(9876543210.99, 'USD', ES), 'USD 9.876.543.210,99');
});

test('parsea montos con separadores locales', () => {
  assert.deepEqual(parseAmountInput('1.234,56', ES, 2), {
    ok: true,
    value: 1234.56,
  });
  assert.deepEqual(parseAmountInput('1,234.56', EN, 2), {
    ok: true,
    value: 1234.56,
  });
  assert.deepEqual(parseAmountInput('1.234', ES, 2), {
    ok: true,
    value: 1234,
  });
  assert.deepEqual(parseAmountInput('1,234', EN, 2), {
    ok: true,
    value: 1234,
  });
  assert.deepEqual(parseAmountInput('0,5', ES, 2), {
    ok: true,
    value: 0.5,
  });
  assert.deepEqual(parseAmountInput('1 234,56', ES, 2), {
    ok: true,
    value: 1234.56,
  });
});

test('rechaza montos vacíos, negativos o con formato inválido', () => {
  assert.deepEqual(parseAmountInput('', ES, 2), {
    ok: false,
    error: 'empty',
  });
  assert.deepEqual(parseAmountInput('-1', EN, 2), {
    ok: false,
    error: 'negative',
  });
  assert.deepEqual(parseAmountInput('1.2.3', ES, 2), {
    ok: false,
    error: 'invalid',
  });
  assert.deepEqual(parseAmountInput('1e309', EN, 2), {
    ok: false,
    error: 'invalid',
  });
  assert.deepEqual(parseAmountInput('12,345', ES, 2), {
    ok: false,
    error: 'tooManyDecimals',
  });
});

test('aplica cero, decimales de moneda y monto máximo', () => {
  assert.deepEqual(parseAmountInput('0', EN, 2), {
    ok: false,
    error: 'zero',
  });
  assert.deepEqual(parseAmountInput('0', EN, 2, { allowZero: true }), {
    ok: true,
    value: 0,
  });
  assert.deepEqual(parseAmountInput('1.5', EN, 0), {
    ok: false,
    error: 'tooManyDecimals',
  });
  assert.deepEqual(parseAmountInput('1234', EN, 0), {
    ok: true,
    value: 1234,
  });
  assert.deepEqual(parseAmountInput('1000000000000.01', EN, 2), {
    ok: false,
    error: 'tooLarge',
  });
  assert.deepEqual(parseAmountInput('1000000000000', EN, 2), {
    ok: true,
    value: 1000000000000,
  });
});
