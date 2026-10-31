import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appConfig = JSON.parse(
  readFileSync(new URL('../../app.json', import.meta.url), 'utf8')
);

test('desactiva las copias de seguridad automáticas de Android', () => {
  assert.equal(appConfig.expo.android.allowBackup, false);
});

test('define identificadores de tienda distintos por plataforma', () => {
  assert.equal(appConfig.expo.android.package, 'com.devjorgerafael.flux_balance');
  assert.equal(appConfig.expo.ios.bundleIdentifier, 'com.devjorgerafael.flux-balance');
});
