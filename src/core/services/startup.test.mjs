import test from 'node:test';
import assert from 'node:assert/strict';

import { runStartup, toError } from './startup.ts';

test('devuelve el error de inicialización y no carga preferencias', async () => {
  const initError = new Error('database unavailable');
  let cleanupCalls = 0;
  let preferenceCalls = 0;

  const result = await runStartup({
    cleanup: () => {
      cleanupCalls += 1;
    },
    initialize: async () => {
      throw initError;
    },
    loadPreferences: async () => {
      preferenceCalls += 1;
      return { themePreference: 'system' };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, initError);
  assert.equal(cleanupCalls, 1);
  assert.equal(preferenceCalls, 0);
});

test('la limpieza de caché no bloquea el arranque si falla', async () => {
  let initialized = false;

  const result = await runStartup({
    cleanup: () => {
      throw new Error('cache unavailable');
    },
    initialize: async () => {
      initialized = true;
    },
    loadPreferences: async () => ({ themePreference: 'dark' }),
  });

  assert.equal(initialized, true);
  assert.deepEqual(result, {
    ok: true,
    preferences: { themePreference: 'dark' },
  });
});

test('devuelve las preferencias cuando la inicialización termina bien', async () => {
  const result = await runStartup({
    cleanup: () => {},
    initialize: async () => {},
    loadPreferences: async () => ({ languagePreference: 'es' }),
  });

  assert.deepEqual(result, {
    ok: true,
    preferences: { languagePreference: 'es' },
  });
});

test('normaliza errores que no son instancias de Error', () => {
  assert.equal(toError('fallo de base').message, 'fallo de base');
  assert.equal(toError({ reason: 'sin detalles' }).message, 'Unknown error');
  assert.equal(toError(null).message, 'Unknown error');
});
