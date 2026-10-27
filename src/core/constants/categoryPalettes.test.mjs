import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_COLOR_PALETTES,
  isPaletteColor,
  pickUnusedPaletteColor,
} from './categoryPalettes.ts';

test('defines two 6 by 9 selector palettes with valid unique colors', () => {
  for (const palette of Object.values(CATEGORY_COLOR_PALETTES)) {
    assert.equal(palette.length, 6);
    assert.ok(palette.every((row) => row.length === 9));
    assert.equal(new Set(palette.flat()).size, 54);
    assert.ok(palette.flat().every((color) => /^#[0-9A-F]{6}$/.test(color)));
  }
});

test('checks colors against the requested type palette', () => {
  assert.equal(isPaletteColor('EXPENSE', '#B42222'), true);
  assert.equal(isPaletteColor('INCOME', '#248950'), true);
  assert.equal(isPaletteColor('EXPENSE', '#248950'), false);
  assert.equal(isPaletteColor('INCOME', '#B42222'), false);
});

test('picks the first unused color for a type', () => {
  assert.equal(pickUnusedPaletteColor('EXPENSE', new Set()), '#D9B526');
  assert.equal(
    pickUnusedPaletteColor('EXPENSE', new Set(['#d9b526'])),
    '#D99D26'
  );
  assert.equal(pickUnusedPaletteColor('INCOME', new Set()), '#2BD474');
});
