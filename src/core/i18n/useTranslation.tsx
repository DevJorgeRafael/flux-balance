import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocales } from 'expo-localization';
import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import { Language, TranslationKey, translations } from './translations';

type TranslationParams = Record<string, string | number>;

interface TranslationContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
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

const TranslationContext = createContext<TranslationContextValue | null>(null);

function getDeviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
}

async function loadSavedLanguage(): Promise<Language | null> {
  const saved = await getAppSetting('language');
  return saved === 'es' || saved === 'en' ? saved : null;
}

async function saveLanguage(language: Language): Promise<void> {
  await setAppSetting('language', language);
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);

  useEffect(() => {
    let cancelled = false;
    void loadSavedLanguage()
      .then((savedLanguage) => {
        if (!cancelled && savedLanguage) setLanguageState(savedLanguage);
      })
      .catch((error) => {
        console.error('Error loading language preference:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    void saveLanguage(nextLanguage).catch((error) => {
      console.error('Error saving language preference:', error);
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'es' ? 'en' : 'es');
  }, [language, setLanguage]);

  const value = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key, params) => formatTranslation(translations[language][key], params),
    }),
    [language, setLanguage, toggleLanguage]
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
