import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIVACY_URL,
  SHOW_DONATION,
  SUPPORT_URL,
  isPrivacyVisible,
  isSupportVisible,
} from './about.ts';

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

test('muestra la privacidad solo cuando hay una URL configurada', () => {
  assert.equal(isPrivacyVisible('https://ejemplo.com/privacidad'), true);
  assert.equal(isPrivacyVisible(''), false);
  assert.equal(isPrivacyVisible('   '), false);
});

test('oculta privacidad y apoyo con la configuración de release', () => {
  assert.equal(PRIVACY_URL, '');
  assert.equal(SHOW_DONATION, false);
  assert.equal(isPrivacyVisible(PRIVACY_URL), false);
  assert.equal(isSupportVisible(SHOW_DONATION, SUPPORT_URL), false);
});
