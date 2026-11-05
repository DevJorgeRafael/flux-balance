import test from 'node:test';
import assert from 'node:assert/strict';

import { isMiuiDevice } from './miui.ts';

test('detecta dispositivos Xiaomi, Redmi y POCO', () => {
  assert.equal(
    isMiuiDevice({ manufacturer: 'Xiaomi', brand: 'Redmi' }),
    true
  );
  assert.equal(
    isMiuiDevice({ manufacturer: 'Xiaomi Communications', brand: 'POCO' }),
    true
  );
  assert.equal(isMiuiDevice({ manufacturer: 'xiaomi', brand: null }), true);
});

test('ignora otras marcas y datos vacíos', () => {
  assert.equal(
    isMiuiDevice({ manufacturer: 'Samsung', brand: 'Galaxy' }),
    false
  );
  assert.equal(isMiuiDevice({ manufacturer: null, brand: '' }), false);
  assert.equal(isMiuiDevice({}), false);
});
