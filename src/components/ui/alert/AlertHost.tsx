import React, { useEffect, useMemo } from 'react';

import { useTranslation } from '@/core/i18n/useTranslation';
import {
  UIProvider,
  useIcons,
  useInsets,
  useThemeMode,
} from '../theme';
import { AlertProvider } from '../organisms/AlertProvider';
import { alertTheme } from './alertTheme';
import {
  setAlertProviderMounted,
  setNativeAlertScheme,
} from './appAlert';

/**
 * Monta el único AlertProvider de la app. El UIProvider anidado existe solo
 * para que el diálogo use su propio tema, sin cambiar el de las pantallas.
 */
export function AlertHost() {
  const { isDark, mode, setMode } = useThemeMode();
  const insets = useInsets();
  const icons = useIcons();
  const { t } = useTranslation();

  useEffect(() => {
    setNativeAlertScheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    setAlertProviderMounted(true);
    return () => setAlertProviderMounted(false);
  }, []);

  const labels = useMemo(
    () => ({
      close: t('close'),
      cancel: t('cancel'),
      confirm: t('accept'),
    }),
    [t]
  );

  return (
    <UIProvider
      theme={alertTheme}
      mode={mode}
      onModeChange={setMode}
      insets={insets}
      icons={icons}
      labels={labels}
      allowFontScaling
    >
      <AlertProvider>{null}</AlertProvider>
    </UIProvider>
  );
}
