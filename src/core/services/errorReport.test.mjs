import test from 'node:test';
import assert from 'node:assert/strict';

import { buildErrorReport } from './errorReport.ts';

const metadata = {
  appVersion: '1.6.2',
  platform: 'android 35',
  generatedAt: '2026-10-30T12:00:00.000Z',
};

test('incluye metadatos técnicos y el error, sin propiedades financieras', () => {
  const error = Object.assign(new Error('database unavailable'), {
    accountName: 'Cuenta secreta',
    balance: 1234.56,
  });

  const report = buildErrorReport(error, metadata, 'es');

  assert.match(report, /Informe técnico de Flux Balance/);
  assert.match(report, /1\.6\.2/);
  assert.match(report, /android 35/);
  assert.match(report, /database unavailable/);
  assert.doesNotMatch(report, /Cuenta secreta/);
  assert.doesNotMatch(report, /1234\.56/);
});

test('usa las etiquetas del idioma seleccionado', () => {
  const report = buildErrorReport('plain failure', metadata, 'en');

  assert.match(report, /Flux Balance technical report/);
  assert.match(report, /App version: 1\.6\.2/);
  assert.match(report, /plain failure/);
});

test('normaliza errores desconocidos y mensajes vacíos', () => {
  const unknown = buildErrorReport({ reason: 'sin detalles' }, metadata, 'es');
  assert.match(unknown, /Error desconocido/);

  const empty = buildErrorReport(new Error(''), metadata, 'es');
  assert.match(empty, /Sin mensaje/);
});
