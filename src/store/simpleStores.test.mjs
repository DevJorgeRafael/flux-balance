import test from 'node:test';
import assert from 'node:assert/strict';

import { useHomeCardsStore } from './homeCardsStore.ts';
import { useSplashTransitionStore } from './splashTransitionStore.ts';
import { useThemePreferenceStore } from './themePreferenceStore.ts';
import { useLanguagePreferenceStore } from './languagePreferenceStore.ts';
import { useCurrencyStore } from './currencyStore.ts';
import { useAlertStore } from './alertStore.ts';

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
  useAlertStore.setState({
    visible: false,
    title: '',
    type: 'info',
    buttons: [],
    resolver: null,
  });
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

test('alert resuelve al pulsar su botón', async () => {
  const promise = useAlertStore.getState().show({ title: 'Aviso' });
  assert.equal(useAlertStore.getState().visible, true);

  useAlertStore.getState().buttons[0]?.onPress?.();
  await promise;

  assert.equal(useAlertStore.getState().visible, false);
});

test('confirm devuelve true o false según el botón', async () => {
  const confirmed = useAlertStore
    .getState()
    .confirm({ title: '¿Borrar?', confirmText: 'Sí', cancelText: 'No' });
  useAlertStore.getState().buttons[1]?.onPress?.();
  assert.equal(await confirmed, true);

  const cancelled = useAlertStore
    .getState()
    .confirm({ title: '¿Borrar?', confirmText: 'Sí', cancelText: 'No' });
  useAlertStore.getState().buttons[0]?.onPress?.();
  assert.equal(await cancelled, false);
});

test('theme, idioma y moneda guardan su preferencia', () => {
  useThemePreferenceStore.getState().setPreference('dark');
  useLanguagePreferenceStore.getState().setPreference('es');
  useCurrencyStore.getState().setCode('EUR');

  assert.equal(useThemePreferenceStore.getState().preference, 'dark');
  assert.equal(useLanguagePreferenceStore.getState().preference, 'es');
  assert.equal(useCurrencyStore.getState().code, 'EUR');
});
