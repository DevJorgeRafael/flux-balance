import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  LANGUAGE_PREFERENCE_KEY,
  THEME_PREFERENCE_KEY,
  parseLanguagePreference,
  parseThemePreference,
  type LanguagePreference,
  type ThemePreference,
} from './preferences';

export interface StoredPreferences {
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  themePreference: DEFAULT_THEME_PREFERENCE,
  languagePreference: DEFAULT_LANGUAGE_PREFERENCE,
};

export async function loadStoredPreferences(): Promise<StoredPreferences> {
  try {
    const [savedTheme, savedLanguage] = await Promise.all([
      getAppSetting(THEME_PREFERENCE_KEY),
      getAppSetting(LANGUAGE_PREFERENCE_KEY),
    ]);

    return {
      themePreference: parseThemePreference(savedTheme),
      languagePreference: parseLanguagePreference(savedLanguage),
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await setAppSetting(THEME_PREFERENCE_KEY, preference);
}

export async function saveLanguagePreference(preference: LanguagePreference): Promise<void> {
  await setAppSetting(LANGUAGE_PREFERENCE_KEY, preference);
}
