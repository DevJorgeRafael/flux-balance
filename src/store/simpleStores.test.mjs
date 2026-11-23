import test from 'node:test';
import assert from 'node:assert/strict';

import { useHomeCardsStore } from './homeCardsStore.ts';
import { useSplashTransitionStore } from './splashTransitionStore.ts';
import { useThemePreferenceStore } from './themePreferenceStore.ts';
import { useLanguagePreferenceStore } from './languagePreferenceStore.ts';
import { useCurrencyStore } from './currencyStore.ts';

test.beforeEach(() => {
  useHomeCardsStore.getState().hydrate({
    anticipations: true,
    goals: true,
    upcomingReminders: true,
  });
  useSplashTransitionStore.getState().setState({
    isRevealing: true,
    isSplashHidden: true,
    revealDelay: 0,
  });
  useThemePreferenceStore.getState().setPreference('system');
  useLanguagePreferenceStore.getState().setPreference('system');
  useCurrencyStore.setState({ code: 'USD' });
});

test('homeCards actualiza una sola tarjeta', () => {
  useHomeCardsStore.getState().setVisible('goals', false);
  assert.deepEqual(useHomeCardsStore.getState().visibility, {
    anticipations: true,
    goals: false,
    upcomingReminders: true,
  });
});

test('splash publica el estado derivado', () => {
  useSplashTransitionStore.getState().setState({
    isRevealing: false,
    isSplashHidden: true,
    revealDelay: 120,
  });
  assert.equal(useSplashTransitionStore.getState().revealDelay, 120);
  assert.equal(useSplashTransitionStore.getState().isRevealing, false);
});

test('theme, idioma y moneda guardan su preferencia', () => {
  useThemePreferenceStore.getState().setPreference('dark');
  useLanguagePreferenceStore.getState().setPreference('es');
  useCurrencyStore.getState().setCode('EUR');

  assert.equal(useThemePreferenceStore.getState().preference, 'dark');
  assert.equal(useLanguagePreferenceStore.getState().preference, 'es');
  assert.equal(useCurrencyStore.getState().code, 'EUR');
});
