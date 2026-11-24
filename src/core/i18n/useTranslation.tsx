import { useCallback, useMemo } from 'react';
import { useLocales } from 'expo-localization';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  resolveLanguage,
  type LanguagePreference,
} from '@/core/preferences/preferences';
import { saveLanguagePreference } from '@/core/preferences/preferencesStorage';
import { useLanguagePreferenceStore } from '@/store/languagePreferenceStore';
import { Language, TranslationKey, translations } from './translations';

type TranslationParams = Record<string, string | number>;

export interface TranslationContextValue {
  language: Language;
  languagePreference: LanguagePreference;
  setLanguage: (language: Language) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

function formatTranslation(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(String(value)),
    template
  );
}

export function useTranslation(): TranslationContextValue {
  const locales = useLocales();
  const languagePreference = useLanguagePreferenceStore((state) => state.preference);
  const setPreference = useLanguagePreferenceStore((state) => state.setPreference);
  const language = resolveLanguage(
    languagePreference,
    locales[0]?.languageCode ?? DEFAULT_LANGUAGE_PREFERENCE
  );

  const setLanguagePreference = useCallback(
    (nextPreference: LanguagePreference) => {
      setPreference(nextPreference);
      void saveLanguagePreference(nextPreference).catch((error) => {
        console.error('Error saving language preference:', error);
      });
    },
    [setPreference]
  );

  const setLanguage = useCallback(
    (nextLanguage: Language) => setLanguagePreference(nextLanguage),
    [setLanguagePreference]
  );

  const toggleLanguage = useCallback(() => {
    setLanguagePreference(language === 'es' ? 'en' : 'es');
  }, [language, setLanguagePreference]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      formatTranslation(translations[language][key], params),
    [language]
  );

  return useMemo(
    () => ({
      language,
      languagePreference,
      setLanguage,
      setLanguagePreference,
      toggleLanguage,
      t,
    }),
    [
      language,
      languagePreference,
      setLanguage,
      setLanguagePreference,
      toggleLanguage,
      t,
    ]
  );
}
