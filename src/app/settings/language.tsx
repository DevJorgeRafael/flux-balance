import React from 'react';
import { router } from 'expo-router';
import {
  PreferenceSelectorScreen,
  type PreferenceOption,
} from '@/components/settings/PreferenceSelectorScreen';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { LanguagePreference } from '@/core/preferences/preferences';

const NATIVE_LANGUAGE_OPTIONS: readonly PreferenceOption<LanguagePreference>[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

export default function LanguageSelectorScreen() {
  const { t, languagePreference, setLanguagePreference } = useTranslation();

  const options: PreferenceOption<LanguagePreference>[] = [
    { value: 'system', label: t('systemDefault') },
    ...NATIVE_LANGUAGE_OPTIONS,
  ];

  const handleSelect = (preference: LanguagePreference) => {
    setLanguagePreference(preference);
    router.back();
  };

  return (
    <PreferenceSelectorScreen
      title={t('language')}
      options={options}
      selectedValue={languagePreference}
      onSelect={handleSelect}
    />
  );
}
