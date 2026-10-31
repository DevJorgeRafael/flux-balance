import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  countLicensePackages,
  filterLicenseGroups,
  isCombinedLicense,
  mergeLicenseGroups,
} from './license-search.ts';
import { translations } from '../i18n/translations.ts';

function readLicenseData(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const mergedGroups = mergeLicenseGroups(
  readLicenseData('../../constants/thirdPartyLicenses.json').groups,
  readLicenseData('../../constants/vendoredLicenses.json').groups
);

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

test('incluye orn-ui con MIT y su aviso tras combinar licencias vendored', () => {
  const ornGroup = mergedGroups.find(
    (group) =>
      group.license === 'MIT' &&
      group.packages.some((pkg) => pkg.name === 'orn-ui')
  );
  const ornPackage = ornGroup?.packages.find((pkg) => pkg.name === 'orn-ui');

  assert.ok(ornGroup);
  assert.equal(ornPackage?.version, '0.2.10');
  assert.equal(ornPackage?.noticeKey, 'ornUiAttribution');
  assert.match(ornGroup.text, /MIT License/);
  assert.match(ornGroup.text, /Permission is hereby granted/);
});

test('la búsqueda de orn incluye orn-ui y conserva acorn', () => {
  const result = filterLicenseGroups(mergedGroups, 'orn');
  const names = result.groups.flatMap((group) =>
    group.packages.map((pkg) => pkg.name)
  );

  assert.ok(names.includes('orn-ui'));
  assert.ok(names.includes('acorn'));
});

test('el aviso de orn-ui existe en español e inglés', () => {
  for (const language of ['es', 'en']) {
    const notice = translations[language].ornUiAttribution;

    assert.match(notice, /orn-ui/);
    assert.match(notice, /David Trujillo/);
    assert.match(notice, /MIT/);
  }
});
