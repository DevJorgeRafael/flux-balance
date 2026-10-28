import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AA_CONTRAST,
  contrast,
  getReadableBackgroundColor,
  getReadableChipColors,
  getReadableTextColor,
} from './colors.ts';
import { darkPalette, lightPalette, readableTextCandidates } from './palettes.ts';
import { CATEGORY_COLOR_PALETTES } from '../../../core/constants/categoryPalettes.ts';

const CASES = [
  ['blanco', '#FFFFFF'],
  ['negro', '#000000'],
  ['amarillo', '#DBBE4D'],
  ['azul medio', '#2868B5'],
  ['turquesa', '#2BD4D1'],
  ['verde', '#248950'],
  ['hex de 3 dígitos claro', '#fff'],
  ['hex de 3 dígitos oscuro', '#000'],
];

function readablePair(background) {
  const chipBackground = getReadableBackgroundColor(background);
  const chipText = getReadableTextColor(chipBackground);
  return { chipBackground, chipText, ratio: contrast(chipBackground, chipText) };
}

for (const [label, background] of CASES) {
  test(`garantiza AA sobre ${label}`, () => {
    const { chipBackground, chipText, ratio } = readablePair(background);

    assert.ok(
      ratio >= AA_CONTRAST,
      `${background} -> ${chipBackground}/${chipText} (${ratio})`
    );
    assert.ok(
      chipText === readableTextCandidates.light ||
        chipText === readableTextCandidates.dark
    );
  });
}

test('elige el candidato con mayor contraste', () => {
  assert.equal(getReadableTextColor('#FFFFFF'), readableTextCandidates.dark);
  assert.equal(getReadableTextColor('#000000'), readableTextCandidates.light);
  assert.equal(getReadableTextColor('#2868B5'), readableTextCandidates.light);
  assert.equal(getReadableTextColor('#DBBE4D'), readableTextCandidates.dark);
});

test('acepta hex de 3 y 6 dígitos, con o sin numeral', () => {
  assert.equal(getReadableTextColor('#fff'), readableTextCandidates.dark);
  assert.equal(getReadableTextColor('000'), readableTextCandidates.light);
  assert.equal(getReadableTextColor('#2868B5'), getReadableTextColor('2868B5'));
});

const CARD_BACKGROUNDS = [
  ['claro', lightPalette.surface, false],
  ['oscuro', darkPalette.surface, true],
];

function assertChipContrast(color, cardBackground, isDark, label) {
  const chip = getReadableChipColors(color, cardBackground, isDark);
  const ratio = contrast(chip.backgroundColor, chip.textColor);

  assert.ok(
    ratio >= AA_CONTRAST,
    `${label}: ${color} -> ${chip.backgroundColor}/${chip.textColor} (${ratio})`
  );

  if (!chip.isSoft) {
    assert.equal(chip.textColor, readableTextCandidates.light, label);
  }

  return chip;
}

test('todos los colores de las paletas generan chips AA en claro y oscuro', () => {
  const paletteColors = Object.values(CATEGORY_COLOR_PALETTES).flatMap((rows) =>
    rows.flat()
  );

  for (const color of paletteColors) {
    for (const [theme, cardBackground, isDark] of CARD_BACKGROUNDS) {
      assertChipContrast(color, cardBackground, isDark, theme);
    }
  }
});

test('usa fondo sólido oscurecido con texto blanco cuando el ajuste es corto', () => {
  const chip = assertChipContrast('#B48322', lightPalette.surface, false, 'dorado');

  assert.equal(chip.isSoft, false);
  assert.equal(chip.textColor, readableTextCandidates.light);
  assert.notEqual(chip.backgroundColor, '#B48322');
});

test('pasa a fondo tenue cuando haría falta oscurecer más de 25 puntos', () => {
  const soft = assertChipContrast('#DFD19A', lightPalette.surface, false, 'arena');
  const solid = assertChipContrast('#2BD474', lightPalette.surface, false, 'verde');

  assert.equal(soft.isSoft, true);
  assert.notEqual(soft.textColor, readableTextCandidates.light);
  assert.equal(solid.isSoft, false);
  assert.equal(solid.textColor, readableTextCandidates.light);
});

test('el gris de Otros alcanza AA en claro y oscuro', () => {
  for (const [theme, cardBackground, isDark, background] of [
    ['claro', lightPalette.surface, false, lightPalette.chartOther],
    ['oscuro', darkPalette.surface, true, darkPalette.chartOther],
  ]) {
    assertChipContrast(background, cardBackground, isDark, theme);
  }
});

test('un fondo inválido devuelve el color de texto normal del tema', () => {
  assert.equal(getReadableTextColor('no-es-un-color'), lightPalette.text);
  assert.equal(getReadableTextColor('no-es-un-color', '#123456'), '#123456');
  assert.equal(getReadableBackgroundColor('no-es-un-color'), 'no-es-un-color');

  assert.deepEqual(
    getReadableChipColors('no-es-un-color', lightPalette.surface, false, '#123456'),
    {
      backgroundColor: 'no-es-un-color',
      textColor: '#123456',
      isSoft: false,
    }
  );
});
