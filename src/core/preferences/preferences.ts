export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'system' | 'es' | 'en';
export type ResolvedTheme = 'light' | 'dark';
export type ResolvedLanguage = 'es' | 'en';

export type SystemColorScheme = 'light' | 'dark' | null | undefined;

export const THEME_PREFERENCE_KEY = 'themePreference';
export const LANGUAGE_PREFERENCE_KEY = 'languagePreference';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = 'system';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];
export const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = ['system', 'es', 'en'];

function normalize(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  const normalized = normalize(value);
  return (THEME_PREFERENCES as readonly string[]).includes(normalized)
    ? (normalized as ThemePreference)
    : DEFAULT_THEME_PREFERENCE;
}

export function parseLanguagePreference(value: string | null | undefined): LanguagePreference {
  const normalized = normalize(value);
  return (LANGUAGE_PREFERENCES as readonly string[]).includes(normalized)
    ? (normalized as LanguagePreference)
    : DEFAULT_LANGUAGE_PREFERENCE;
}

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: SystemColorScheme
): ResolvedTheme {
  const parsed = parseThemePreference(preference);
  if (parsed === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return parsed;
}

export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguage: string | null | undefined
): ResolvedLanguage {
  const parsed = parseLanguagePreference(preference);
  if (parsed !== 'system') {
    return parsed;
  }

  const normalized = normalize(deviceLanguage).split(/[-_]/)[0];
  return normalized === 'es' ? 'es' : 'en';
}
