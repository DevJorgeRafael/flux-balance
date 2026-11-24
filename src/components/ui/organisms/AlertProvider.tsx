import React from 'react';
import { Alert, type AlertType } from './Alert';
import { useAlertStore } from '@/store/alertStore';

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  /** Botón de confirmar en rojo/destructivo (para "eliminar", etc). */
  destructive?: boolean;
}

/**
 * API imperativa del alert. El estado vive en `alertStore`, así que estos
 * helpers funcionan también desde servicios fuera del árbol de React.
 */
export function showAlert(options: AlertOptions): Promise<void> {
  return useAlertStore.getState().show(options);
}

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return useAlertStore.getState().confirm(options);
}

export function hideAlert(): void {
  useAlertStore.getState().hide();
}

export function useAlert() {
  return {
    alert: showAlert,
    confirm: showConfirm,
    hide: hideAlert,
  };
}

export function AlertProvider({ children }: { children?: React.ReactNode }) {
  const visible = useAlertStore((state) => state.visible);
  const title = useAlertStore((state) => state.title);
  const message = useAlertStore((state) => state.message);
  const type = useAlertStore((state) => state.type);
  const buttons = useAlertStore((state) => state.buttons);
  const hide = useAlertStore((state) => state.hide);

  return (
    <>
      {children}
      <Alert
        visible={visible}
        title={title}
        message={message}
        type={type}
        buttons={buttons}
        onClose={hide}
      />
    </>
  );
}
