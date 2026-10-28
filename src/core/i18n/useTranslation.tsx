import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocales } from 'expo-localization';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  resolveLanguage,
  type LanguagePreference,
} from '@/core/preferences/preferences';
import { saveLanguagePreference } from '@/core/preferences/preferencesStorage';
import { Language, TranslationKey, translations } from './translations';

type TranslationParams = Record<string, string | number>;

interface TranslationContextValue {
  language: Language;
  languagePreference: LanguagePreference;
  setLanguage: (language: Language) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

interface TranslationProviderProps {
  children: React.ReactNode;
  initialPreference?: LanguagePreference;
}

function formatTranslation(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(String(value)),
    template
  );
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({
  children,
  initialPreference = DEFAULT_LANGUAGE_PREFERENCE,
}: TranslationProviderProps) {
  const locales = useLocales();
  const [languagePreference, setLanguagePreferenceState] =
    useState<LanguagePreference>(initialPreference);

  const language = resolveLanguage(languagePreference, locales[0]?.languageCode);

  const setLanguagePreference = useCallback((nextPreference: LanguagePreference) => {
    setLanguagePreferenceState(nextPreference);
    void saveLanguagePreference(nextPreference).catch((error) => {
      console.error('Error saving language preference:', error);
    });
  }, []);

  const setLanguage = useCallback(
    (nextLanguage: Language) => setLanguagePreference(nextLanguage),
    [setLanguagePreference]
  );

  const toggleLanguage = useCallback(() => {
    setLanguagePreference(language === 'es' ? 'en' : 'es');
  }, [language, setLanguagePreference]);

  const value = useMemo<TranslationContextValue>(
    () => ({
      language,
      languagePreference,
      setLanguage,
      setLanguagePreference,
      toggleLanguage,
      t: (key, params) => formatTranslation(translations[language][key], params),
    }),
    [language, languagePreference, setLanguage, setLanguagePreference, toggleLanguage]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider.');
  }
  return context;
}
