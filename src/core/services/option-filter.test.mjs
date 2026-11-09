import test from 'node:test';
import assert from 'node:assert/strict';

import { filterOptionsByName } from './option-filter.ts';

const options = [
  { id: '1', name: 'Comida' },
  { id: '2', name: 'Educación' },
  { id: '3', name: 'Salud' },
];

test('devuelve todas las opciones cuando la búsqueda está vacía', () => {
  assert.deepEqual(filterOptionsByName(options, ''), options);
  assert.deepEqual(filterOptionsByName(options, '   '), options);
});

test('filtra sin distinguir mayúsculas ni acentos', () => {
  assert.deepEqual(filterOptionsByName(options, 'EDUCACION'), [options[1]]);
  assert.deepEqual(filterOptionsByName(options, 'salúd'), [options[2]]);
});

test('devuelve ninguna opción cuando no hay coincidencias', () => {
  assert.deepEqual(filterOptionsByName(options, 'viajes'), []);
});
