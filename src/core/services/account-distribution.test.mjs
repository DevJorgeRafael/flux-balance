import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ACCOUNT_DISTRIBUTION_SEGMENTS,
  OTHER_ACCOUNT_SEGMENT_ID,
  buildAccountDistribution,
} from './account-distribution.ts';
import { CATEGORY_COLOR_PALETTES } from '../constants/categoryPalettes.ts';

const options = {
  otherLabel: 'Otras',
  otherColor: '#6E727A',
};

function account(id, name, balance) {
  return { id, name, balance };
}

function sumPercentages(result) {
  return result.segments.reduce((sum, segment) => sum + segment.percentage, 0);
}

test('reparte las dos cuentas demo y suma 100%', () => {
  const result = buildAccountDistribution(
    [
      account('demo-acc-1', 'Cuenta Sueldo (Galicia)', 1274500),
      account('demo-acc-2', 'Fondo MercadoPago', 824000),
    ],
    options
  );

  assert.equal(result.shouldShowBar, true);
  assert.equal(result.total, 2098500);
  assert.equal(result.segments.length, 2);
  assert.deepEqual(
    result.segments.map((segment) => segment.name),
    ['Cuenta Sueldo (Galicia)', 'Fondo MercadoPago']
  );
  assert.deepEqual(
    result.segments.map((segment) => segment.percentage),
    [61, 39]
  );
  assert.equal(sumPercentages(result), 100);
});

test('no muestra barra con una sola cuenta', () => {
  const result = buildAccountDistribution(
    [account('solo', 'Cuenta única', 5000)],
    options
  );

  assert.equal(result.shouldShowBar, false);
  assert.deepEqual(result.segments, []);
  assert.equal(result.total, 5000);
});

test('no muestra barra sin cuentas', () => {
  const result = buildAccountDistribution([], options);

  assert.equal(result.shouldShowBar, false);
  assert.deepEqual(result.segments, []);
  assert.equal(result.total, 0);
});

test('no muestra barra si solo hay un saldo positivo', () => {
  const result = buildAccountDistribution(
    [account('con-saldo', 'Con saldo', 5000), account('sin-saldo', 'Sin saldo', 0)],
    options
  );

  assert.equal(result.shouldShowBar, false);
  assert.deepEqual(result.segments, []);
});

test('agrupa el resto en Otras cuando supera el máximo', () => {
  const accounts = Array.from({ length: 7 }, (_, index) =>
    account(`acc-${index}`, `Cuenta ${index}`, 1000 - index * 100)
  );

  const result = buildAccountDistribution(accounts, options);

  assert.equal(result.shouldShowBar, true);
  assert.equal(result.segments.length, MAX_ACCOUNT_DISTRIBUTION_SEGMENTS);
  assert.deepEqual(
    result.segments.map((segment) => segment.name),
    ['Cuenta 0', 'Cuenta 1', 'Cuenta 2', 'Cuenta 3', 'Otras']
  );
  assert.equal(result.segments.at(-1)?.id, OTHER_ACCOUNT_SEGMENT_ID);
  assert.equal(result.segments.at(-1)?.amount, 1500);
  assert.equal(result.segments.at(-1)?.color, options.otherColor);
  assert.equal(sumPercentages(result), 100);
});

test('con cinco cuentas usa cinco segmentos sin grupo Otras', () => {
  const accounts = Array.from({ length: 5 }, (_, index) =>
    account(`acc-${index}`, `Cuenta ${index}`, 1000 - index * 100)
  );

  const result = buildAccountDistribution(accounts, options);

  assert.equal(result.segments.length, 5);
  assert.ok(result.segments.every((segment) => segment.kind === 'account'));
  assert.equal(sumPercentages(result), 100);
});

test('usa colores de la paleta de categorías y el gris para Otras', () => {
  const paletteColors = new Set(
    [...CATEGORY_COLOR_PALETTES.INCOME, ...CATEGORY_COLOR_PALETTES.EXPENSE].flat()
  );

  const accounts = Array.from({ length: 6 }, (_, index) =>
    account(`acc-${index}`, `Cuenta ${index}`, 600 - index)
  );

  const result = buildAccountDistribution(accounts, options);
  const accountSegments = result.segments.filter((segment) => segment.kind === 'account');
  const otherSegments = result.segments.filter((segment) => segment.kind === 'other');

  assert.ok(accountSegments.every((segment) => paletteColors.has(segment.color)));
  assert.equal(otherSegments.length, 1);
  assert.equal(otherSegments[0]?.color, options.otherColor);
});
