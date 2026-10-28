import React from 'react';
import { router } from 'expo-router';
import { useThemeMode } from '@/components/ui/theme';
import {
  PreferenceSelectorScreen,
  type PreferenceOption,
} from '@/components/settings/PreferenceSelectorScreen';
import { useTranslation } from '@/core/i18n/useTranslation';
import { THEME_PREFERENCES, type ThemePreference } from '@/core/preferences/preferences';

export default function ThemeSelectorScreen() {
  const { t } = useTranslation();
  const { mode, setMode, isDark } = useThemeMode();

  const currentModeLabel = isDark ? t('dark') : t('light');
  const options: PreferenceOption<ThemePreference>[] = THEME_PREFERENCES.map((preference) => ({
    value: preference,
    label: preference === 'system' ? t('systemDefault') : t(preference),
    description:
      preference === 'system' && mode === 'system'
        ? t('nowUsing', { mode: currentModeLabel })
        : undefined,
  }));

  const handleSelect = (preference: ThemePreference) => {
    setMode(preference);
    router.back();
  };

  return (
    <PreferenceSelectorScreen
      title={t('theme')}
      options={options}
      selectedValue={mode}
      onSelect={handleSelect}
    />
  );
}
