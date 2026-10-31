export type AppAlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AppAlertButton {
  text: string;
  style?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface AppAlertOptions {
  type: AppAlertType;
  title: string;
  message?: string;
  buttons: [AppAlertButton, ...AppAlertButton[]];
}

export interface AppConfirmOptions {
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  destructive?: boolean;
  type?: AppAlertType;
}

export interface OrnAlertOptions {
  title: string;
  message?: string;
  type?: AppAlertType;
  confirmText?: string;
  cancelText?: string;
}

export interface OrnConfirmOptions extends OrnAlertOptions {
  destructive?: boolean;
}

export interface NativeAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive';
}

export interface NativeAlertOptions {
  userInterfaceStyle?: 'light' | 'dark';
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AppAlertRuntime {
  platform: string;
  hasProvider: () => boolean;
  showAlert: (options: OrnAlertOptions) => Promise<void>;
  showConfirm: (options: OrnConfirmOptions) => Promise<boolean>;
  nativeAlert: (
    title: string,
    message: string | undefined,
    buttons: NativeAlertButton[],
    options: NativeAlertOptions
  ) => void;
  getColorScheme: () => 'light' | 'dark';
}

function isAndroidWithProvider(runtime: AppAlertRuntime): boolean {
  return runtime.platform === 'android' && runtime.hasProvider();
}

function nativeOptions(runtime: AppAlertRuntime): NativeAlertOptions {
  return {
    userInterfaceStyle: runtime.getColorScheme(),
    cancelable: true,
  };
}

function finishAfterHandler(
  handler: (() => void | Promise<void>) | undefined,
  finish: () => void
): void {
  if (!handler) {
    finish();
    return;
  }

  try {
    Promise.resolve(handler()).then(finish, finish);
  } catch {
    finish();
  }
}

function showNativeAlert(
  runtime: AppAlertRuntime,
  options: AppAlertOptions
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const buttons: NativeAlertButton[] = options.buttons.map((button) => ({
      text: button.text,
      style: button.style,
      onPress: () => finishAfterHandler(button.onPress, finish),
    }));

    runtime.nativeAlert(options.title, options.message, buttons, {
      ...nativeOptions(runtime),
      onDismiss: finish,
    });
  });
}

async function showAppAlert(
  runtime: AppAlertRuntime,
  options: AppAlertOptions
): Promise<void> {
  if (!isAndroidWithProvider(runtime) || options.buttons.length > 2) {
    await showNativeAlert(runtime, options);
    return;
  }

  if (options.buttons.length === 1) {
    const [button] = options.buttons;
    if (button.onPress) {
      await showNativeAlert(runtime, options);
      return;
    }

    await runtime.showAlert({
      title: options.title,
      message: options.message,
      type: options.type,
      confirmText: button.text,
    });
    return;
  }

  const first = options.buttons[0];
  const second = options.buttons[1];
  if (!second) return;

  const cancel =
    first.style === 'cancel' ? first : second.style === 'cancel' ? second : null;
  if (!cancel) {
    await showNativeAlert(runtime, options);
    return;
  }
  const confirm = cancel === first ? second : first;

  const confirmed = await runtime.showConfirm({
    title: options.title,
    message: options.message,
    type: options.type,
    confirmText: confirm.text,
    cancelText: cancel.text,
    destructive: confirm.style === 'destructive',
  });

  await (confirmed ? confirm.onPress?.() : cancel.onPress?.());
}

async function confirmAppAlert(
  runtime: AppAlertRuntime,
  options: AppConfirmOptions
): Promise<boolean> {
  if (!isAndroidWithProvider(runtime)) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      runtime.nativeAlert(
        options.title,
        options.message,
        [
          {
            text: options.cancelText,
            style: 'cancel',
            onPress: () => finish(false),
          },
          {
            text: options.confirmText,
            style: options.destructive ? 'destructive' : 'default',
            onPress: () => finish(true),
          },
        ],
        {
          ...nativeOptions(runtime),
          onDismiss: () => finish(false),
        }
      );
    });
  }

  const confirmed = await runtime.showConfirm({
    title: options.title,
    message: options.message,
    type: options.type ?? 'question',
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    destructive: options.destructive,
  });

  return confirmed === true;
}

export function createAppAlert(runtime: AppAlertRuntime) {
  return {
    appAlert: (options: AppAlertOptions) => showAppAlert(runtime, options),
    appConfirm: (options: AppConfirmOptions) => confirmAppAlert(runtime, options),
  };
}
