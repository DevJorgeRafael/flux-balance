import test from 'node:test';
import assert from 'node:assert/strict';
import { isSupportVisible } from './about.ts';

test('muestra el apoyo con la donación activa y una URL', () => {
  assert.equal(isSupportVisible(true, 'https://paypal.me/ejemplo'), true);
});

test('oculta el apoyo si la donación está desactivada', () => {
  assert.equal(isSupportVisible(false, 'https://paypal.me/ejemplo'), false);
});

test('oculta el apoyo si la URL está vacía o solo tiene espacios', () => {
  assert.equal(isSupportVisible(true, ''), false);
  assert.equal(isSupportVisible(true, '   '), false);
  assert.equal(isSupportVisible(false, ''), false);
});
