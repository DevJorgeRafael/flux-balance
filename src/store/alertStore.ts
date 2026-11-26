import { create } from 'zustand';
import type { AlertButton, AlertType } from '@/components/ui/organisms/Alert';
import type { AlertOptions, ConfirmOptions } from '@/components/ui/organisms/AlertProvider';

type Resolver = ((value: any) => void) | null;

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  type: AlertType;
  buttons: AlertButton[];
  resolver: Resolver;
  show: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  hide: () => void;
  resolve: (value?: any) => void;
  settlePending: () => void;
}

const HIDDEN = {
  visible: false,
  title: '',
  type: 'info' as AlertType,
  buttons: [] as AlertButton[],
  resolver: null as Resolver,
};

export const useAlertStore = create<AlertState>((set, get) => ({
  ...HIDDEN,

  settlePending: () => {
    const resolver = get().resolver;
    if (resolver) resolver(undefined);
    set({ resolver: null });
  },

  resolve: (value) => {
    const resolver = get().resolver;
    set(HIDDEN);
    resolver?.(value);
  },

  hide: () => get().resolve(),

  show: (options) => {
    get().settlePending();
    return new Promise<void>((resolve) => {
      set({
        visible: true,
        title: options.title,
        message: options.message,
        type: options.type ?? 'info',
        buttons: [
          {
            text: options.confirmText ?? 'OK',
            onPress: () => get().resolve(),
          },
        ],
        resolver: resolve,
      });
    });
  },

  confirm: (options) => {
    get().settlePending();
    return new Promise<boolean>((resolve) => {
      set({
        visible: true,
        title: options.title,
        message: options.message,
        type: options.type ?? 'question',
        buttons: [
          {
            text: options.cancelText ?? 'Cancel',
            style: 'cancel',
            variant: 'outline',
            onPress: () => get().resolve(false),
          },
          {
            text: options.confirmText ?? 'OK',
            variant: options.destructive ? 'destructive' : 'primary',
            style: options.destructive ? 'destructive' : 'default',
            onPress: () => get().resolve(true),
          },
        ],
        resolver: resolve,
      });
    });
  },
}));
