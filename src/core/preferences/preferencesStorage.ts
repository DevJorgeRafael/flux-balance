import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import {
  DEFAULT_HOME_CARD_VISIBILITY,
  DEFAULT_LANGUAGE_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  HOME_CARD_KEYS,
  HOME_CARD_PREFERENCE_KEYS,
  LANGUAGE_PREFERENCE_KEY,
  THEME_PREFERENCE_KEY,
  parseHomeCardVisibility,
  parseLanguagePreference,
  parseThemePreference,
  type HomeCardKey,
  type LanguagePreference,
  type ThemePreference,
} from './preferences';

export interface StoredPreferences {
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
  homeCardVisibility: Record<HomeCardKey, boolean>;
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  themePreference: DEFAULT_THEME_PREFERENCE,
  languagePreference: DEFAULT_LANGUAGE_PREFERENCE,
  homeCardVisibility: { ...DEFAULT_HOME_CARD_VISIBILITY },
};

export async function loadStoredPreferences(): Promise<StoredPreferences> {
  try {
    const savedHomeCards = await Promise.all(
      HOME_CARD_KEYS.map((key) => getAppSetting(HOME_CARD_PREFERENCE_KEYS[key]))
    );

    const [savedTheme, savedLanguage] = await Promise.all([
      getAppSetting(THEME_PREFERENCE_KEY),
      getAppSetting(LANGUAGE_PREFERENCE_KEY),
    ]);

    return {
      themePreference: parseThemePreference(savedTheme),
      languagePreference: parseLanguagePreference(savedLanguage),
      homeCardVisibility: Object.fromEntries(
        HOME_CARD_KEYS.map((key, index) => [key, parseHomeCardVisibility(savedHomeCards[index])])
      ) as Record<HomeCardKey, boolean>,
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

export async function saveHomeCardPreference(
  key: HomeCardKey,
  visible: boolean
): Promise<void> {
  await setAppSetting(HOME_CARD_PREFERENCE_KEYS[key], visible ? '1' : '0');
}
