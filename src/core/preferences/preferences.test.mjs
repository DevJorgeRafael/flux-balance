import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_HOME_CARD_VISIBILITY,
  DEFAULT_LANGUAGE_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  HOME_CARD_PREFERENCE_KEYS,
  LANGUAGE_PREFERENCE_KEY,
  THEME_PREFERENCE_KEY,
  parseHomeCardVisibility,
  parseLanguagePreference,
  parseThemePreference,
  resolveLanguage,
  resolveThemeMode,
} from './preferences.ts';

test('los valores por defecto son system', () => {
  assert.equal(DEFAULT_THEME_PREFERENCE, 'system');
  assert.equal(DEFAULT_LANGUAGE_PREFERENCE, 'system');
  assert.equal(THEME_PREFERENCE_KEY, 'themePreference');
  assert.equal(LANGUAGE_PREFERENCE_KEY, 'languagePreference');
});

test('parseThemePreference acepta valores válidos y normaliza', () => {
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.equal(parseThemePreference(' Dark '), 'dark');
});

test('parseThemePreference cae en system con valores ausentes o inválidos', () => {
  assert.equal(parseThemePreference(null), 'system');
  assert.equal(parseThemePreference(undefined), 'system');
  assert.equal(parseThemePreference(''), 'system');
  assert.equal(parseThemePreference('auto'), 'system');
  assert.equal(parseThemePreference('oscuro'), 'system');
});

test('parseLanguagePreference acepta valores válidos y normaliza', () => {
  assert.equal(parseLanguagePreference('system'), 'system');
  assert.equal(parseLanguagePreference('es'), 'es');
  assert.equal(parseLanguagePreference('en'), 'en');
  assert.equal(parseLanguagePreference(' ES '), 'es');
});

test('parseLanguagePreference cae en system con valores ausentes o inválidos', () => {
  assert.equal(parseLanguagePreference(null), 'system');
  assert.equal(parseLanguagePreference(undefined), 'system');
  assert.equal(parseLanguagePreference(''), 'system');
  assert.equal(parseLanguagePreference('fr'), 'system');
});

test('resolveThemeMode en system sigue el esquema del dispositivo', () => {
  assert.equal(resolveThemeMode('system', 'dark'), 'dark');
  assert.equal(resolveThemeMode('system', 'light'), 'light');
});

test('resolveThemeMode en system asume claro si el esquema no se conoce', () => {
  assert.equal(resolveThemeMode('system', null), 'light');
  assert.equal(resolveThemeMode('system', undefined), 'light');
});

test('resolveThemeMode explícito ignora el esquema del dispositivo', () => {
  assert.equal(resolveThemeMode('light', 'dark'), 'light');
  assert.equal(resolveThemeMode('dark', 'light'), 'dark');
});

test('resolveThemeMode con una preferencia inválida se comporta como system', () => {
  assert.equal(resolveThemeMode('auto', 'dark'), 'dark');
  assert.equal(resolveThemeMode('auto', 'light'), 'light');
});

test('resolveLanguage en system usa el idioma del dispositivo', () => {
  assert.equal(resolveLanguage('system', 'es'), 'es');
  assert.equal(resolveLanguage('system', 'es-CO'), 'es');
  assert.equal(resolveLanguage('system', 'es_ES'), 'es');
  assert.equal(resolveLanguage('system', 'en'), 'en');
  assert.equal(resolveLanguage('system', 'en-US'), 'en');
});

test('resolveLanguage en system cae en inglés para idiomas no soportados', () => {
  assert.equal(resolveLanguage('system', 'fr'), 'en');
  assert.equal(resolveLanguage('system', 'de-DE'), 'en');
  assert.equal(resolveLanguage('system', null), 'en');
  assert.equal(resolveLanguage('system', undefined), 'en');
  assert.equal(resolveLanguage('system', ''), 'en');
});

test('resolveLanguage explícito ignora el idioma del dispositivo', () => {
  assert.equal(resolveLanguage('es', 'en-US'), 'es');
  assert.equal(resolveLanguage('en', 'es-ES'), 'en');
});

test('resolveLanguage con una preferencia inválida se comporta como system', () => {
  assert.equal(resolveLanguage('fr', 'es-ES'), 'es');
  assert.equal(resolveLanguage('fr', 'de-DE'), 'en');
});

test('las tarjetas del inicio son visibles por defecto', () => {
  assert.deepEqual(DEFAULT_HOME_CARD_VISIBILITY, {
    anticipations: true,
    goals: true,
    upcomingReminders: true,
  });
  assert.equal(HOME_CARD_PREFERENCE_KEYS.anticipations, 'homeCardAnticipations');
  assert.equal(HOME_CARD_PREFERENCE_KEYS.goals, 'homeCardGoals');
  assert.equal(HOME_CARD_PREFERENCE_KEYS.upcomingReminders, 'homeCardUpcomingReminders');
});

test('parseHomeCardVisibility interpreta los valores guardados', () => {
  assert.equal(parseHomeCardVisibility('1'), true);
  assert.equal(parseHomeCardVisibility('true'), true);
  assert.equal(parseHomeCardVisibility('0'), false);
  assert.equal(parseHomeCardVisibility(' false '), false);
  assert.equal(parseHomeCardVisibility(null), true);
  assert.equal(parseHomeCardVisibility('otro'), true);
});
