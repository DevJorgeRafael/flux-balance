import {
  Alert as NativeAlert,
  Appearance,
  Platform,
} from 'react-native';
import {
  showAlert as showOrnAlert,
  showConfirm as showOrnConfirm,
} from '../organisms/AlertProvider';
import {
  createAppAlert,
  type AppAlertRuntime,
  type NativeAlertButton,
  type NativeAlertOptions,
} from './createAppAlert';

export type {
  AppAlertButton,
  AppAlertOptions,
  AppAlertType,
  AppConfirmOptions,
} from './createAppAlert';

let nativeScheme: 'light' | 'dark' =
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
let providerMounted = false;

export function setNativeAlertScheme(scheme: 'light' | 'dark'): void {
  nativeScheme = scheme;
}

export function setAlertProviderMounted(mounted: boolean): void {
  providerMounted = mounted;
}

const runtime: AppAlertRuntime = {
  platform: Platform.OS,
  hasProvider: () => providerMounted,
  showAlert: (options) => showOrnAlert(options),
  showConfirm: (options) => showOrnConfirm(options),
  nativeAlert: (
    title: string,
    message: string | undefined,
    buttons: NativeAlertButton[],
    options: NativeAlertOptions
  ) => {
    NativeAlert.alert(title, message, buttons, options);
  },
  getColorScheme: () => nativeScheme,
};

const appAlertApi = createAppAlert(runtime);

export const appAlert = appAlertApi.appAlert;
export const appConfirm = appAlertApi.appConfirm;
