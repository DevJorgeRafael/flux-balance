import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppAlert } from './createAppAlert.ts';

function createRuntime(platform, overrides = {}) {
  const calls = [];

  return {
    calls,
    runtime: {
      platform,
      hasProvider: () => overrides.hasProvider ?? true,
      showAlert: async (options) => {
        calls.push({ name: 'showAlert', options });
      },
      showConfirm: async (options) => {
        calls.push({ name: 'showConfirm', options });
        return overrides.confirmResult ?? true;
      },
      nativeAlert: (title, message, buttons, options) => {
        const payload = { name: 'nativeAlert', title, message, buttons, options };
        calls.push(payload);
        overrides.onNative?.(payload);
      },
      getColorScheme: () => overrides.scheme ?? 'dark',
    },
  };
}

test('Android confirma con showConfirm y devuelve true', async () => {
  const { runtime, calls } = createRuntime('android');
  const { appConfirm } = createAppAlert(runtime);

  const result = await appConfirm({
    title: 'Eliminar',
    message: 'No se puede deshacer',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    destructive: true,
  });

  assert.equal(result, true);
  assert.equal(calls[0].name, 'showConfirm');
  assert.deepEqual(calls[0].options, {
    title: 'Eliminar',
    message: 'No se puede deshacer',
    type: 'question',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    destructive: true,
  });
});

test('Android devuelve false al cancelar o cerrar sin elegir', async () => {
  const { runtime } = createRuntime('android', { confirmResult: false });
  const { appConfirm } = createAppAlert(runtime);

  const result = await appConfirm({
    title: 'Eliminar',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  });

  assert.equal(result, false);
});

test('iOS confirma y usa el esquema oscuro en el Alert nativo', async () => {
  let native;
  const { runtime } = createRuntime('ios', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appConfirm } = createAppAlert(runtime);

  const result = appConfirm({
    title: 'Eliminar',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    destructive: true,
  });

  assert.ok(native);
  assert.equal(native.options.userInterfaceStyle, 'dark');
  assert.equal(native.buttons[0].style, 'cancel');
  assert.equal(native.buttons[1].style, 'destructive');

  native.buttons[1].onPress();
  assert.equal(await result, true);
});

test('iOS devuelve false al cancelar', async () => {
  let native;
  const { runtime } = createRuntime('ios', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appConfirm } = createAppAlert(runtime);

  const result = appConfirm({
    title: 'Eliminar',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  });

  native.buttons[0].onPress();
  assert.equal(await result, false);
});

test('iOS devuelve false si el Alert se cierra sin elegir', async () => {
  let native;
  const { runtime } = createRuntime('ios', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appConfirm } = createAppAlert(runtime);

  const result = appConfirm({
    title: 'Eliminar',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  });

  native.options.onDismiss();
  assert.equal(await result, false);
});

test('Android appAlert ejecuta el handler del botón confirmado', async () => {
  const handlers = [];
  const { runtime, calls } = createRuntime('android', { confirmResult: true });
  const { appAlert } = createAppAlert(runtime);

  await appAlert({
    type: 'warning',
    title: 'Exportar',
    message: 'Datos sin cifrar',
    buttons: [
      { text: 'Cancelar', style: 'cancel', onPress: () => handlers.push('cancel') },
      { text: 'Continuar', onPress: () => handlers.push('continue') },
    ],
  });

  assert.deepEqual(handlers, ['continue']);
  assert.equal(calls[0].name, 'showConfirm');
  assert.equal(calls[0].options.type, 'warning');
  assert.equal(calls[0].options.confirmText, 'Continuar');
  assert.equal(calls[0].options.cancelText, 'Cancelar');
});

test('Android appAlert ejecuta el handler de cancelar', async () => {
  const handlers = [];
  const { runtime } = createRuntime('android', { confirmResult: false });
  const { appAlert } = createAppAlert(runtime);

  await appAlert({
    type: 'warning',
    title: 'Exportar',
    buttons: [
      { text: 'Cancelar', style: 'cancel', onPress: () => handlers.push('cancel') },
      { text: 'Continuar', onPress: () => handlers.push('continue') },
    ],
  });

  assert.deepEqual(handlers, ['cancel']);
});

test('Android usa showAlert para un aviso sin handler', async () => {
  const { runtime, calls } = createRuntime('android');
  const { appAlert } = createAppAlert(runtime);

  await appAlert({
    type: 'success',
    title: 'Listo',
    message: 'Datos cargados',
    buttons: [{ text: 'Aceptar' }],
  });

  assert.equal(calls[0].name, 'showAlert');
  assert.deepEqual(calls[0].options, {
    title: 'Listo',
    message: 'Datos cargados',
    type: 'success',
    confirmText: 'Aceptar',
  });
});

test('Android cae al Alert nativo si el único botón tiene handler', async () => {
  const handlers = [];
  let native;
  const { runtime, calls } = createRuntime('android', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appAlert } = createAppAlert(runtime);

  const result = appAlert({
    type: 'info',
    title: 'Aviso',
    buttons: [{ text: 'Aceptar', onPress: () => handlers.push('accept') }],
  });

  assert.equal(calls[0].name, 'nativeAlert');
  native.buttons[0].onPress();
  await result;
  assert.deepEqual(handlers, ['accept']);
});

test('Android cae al Alert nativo si dos botones no marcan cancelar', async () => {
  const handlers = [];
  let native;
  const { runtime, calls } = createRuntime('android', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appAlert } = createAppAlert(runtime);

  const result = appAlert({
    type: 'question',
    title: 'Elegir',
    buttons: [
      { text: 'Uno', onPress: () => handlers.push('one') },
      { text: 'Dos', onPress: () => handlers.push('two') },
    ],
  });

  assert.equal(calls[0].name, 'nativeAlert');
  native.buttons[1].onPress();
  await result;
  assert.deepEqual(handlers, ['two']);
});

test('Android cae al Alert nativo con más de dos botones', async () => {
  let native;
  const { runtime, calls } = createRuntime('android', {
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appAlert } = createAppAlert(runtime);

  const result = appAlert({
    type: 'question',
    title: 'Elegir',
    buttons: [{ text: 'Uno' }, { text: 'Dos' }, { text: 'Tres' }],
  });

  assert.equal(calls[0].name, 'nativeAlert');
  assert.equal(native.buttons.length, 3);
  native.buttons[2].onPress();
  await result;
});

test('Android sin provider cae al Alert nativo', async () => {
  const handlers = [];
  let native;
  const { runtime, calls } = createRuntime('android', {
    hasProvider: false,
    onNative: (payload) => {
      native = payload;
    },
  });
  const { appAlert } = createAppAlert(runtime);

  const result = appAlert({
    type: 'info',
    title: 'Aviso',
    buttons: [{ text: 'Aceptar', onPress: () => handlers.push('accept') }],
  });

  assert.ok(native);
  assert.equal(calls[0].name, 'nativeAlert');
  native.buttons[0].onPress();
  await result;
  assert.deepEqual(handlers, ['accept']);
});
