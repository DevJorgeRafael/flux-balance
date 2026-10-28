import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countLicensePackages,
  filterLicenseGroups,
  isCombinedLicense,
} from './license-search.ts';

const groups = [
  {
    license: 'MIT',
    text: 'MIT',
    packages: [
      { name: 'react', version: '19.0.0' },
      { name: 'expo-router', version: '58.0.26' },
    ],
  },
  {
    license: 'ISC',
    text: 'ISC',
    packages: [{ name: 'boolbase', version: '1.0.0' }],
  },
];

test('devuelve todos los grupos y paquetes sin consulta', () => {
  const result = filterLicenseGroups(groups, '   ');

  assert.equal(result.groups.length, 2);
  assert.equal(result.total, 3);
});

test('filtra por nombre de paquete sin distinguir mayúsculas', () => {
  const result = filterLicenseGroups(groups, 'EXPO');

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].license, 'MIT');
  assert.deepEqual(result.groups[0].packages, [
    { name: 'expo-router', version: '58.0.26' },
  ]);
  assert.equal(result.total, 1);
});

test('descarta los grupos sin coincidencias y conserva sus textos', () => {
  const result = filterLicenseGroups(groups, 'bool');

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].license, 'ISC');
  assert.equal(result.groups[0].text, 'ISC');
  assert.equal(result.total, 1);
});

test('cuenta los paquetes de todos los grupos', () => {
  assert.equal(countLicensePackages(groups), 3);
});

test('detecta expresiones de licencia combinadas', () => {
  assert.equal(isCombinedLicense('MIT'), false);
  assert.equal(isCombinedLicense('Apache-2.0'), false);
  assert.equal(isCombinedLicense('MIT AND Apache-2.0'), true);
  assert.equal(isCombinedLicense('(MIT OR CC0-1.0)'), true);
});
