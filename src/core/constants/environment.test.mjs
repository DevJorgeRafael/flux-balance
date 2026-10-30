import test from 'node:test';
import assert from 'node:assert/strict';

import { getSettingsSectionVisibility } from './environment.ts';

test('en producción el modo desarrollador no se muestra y Datos sí', () => {
  assert.deepEqual(getSettingsSectionVisibility('production'), {
    developerMode: false,
    data: true,
  });
});

test('fuera de producción el modo desarrollador y Datos se muestran', () => {
  for (const nodeEnv of [undefined, 'development', 'test']) {
    assert.deepEqual(getSettingsSectionVisibility(nodeEnv), {
      developerMode: true,
      data: true,
    });
  }
});
