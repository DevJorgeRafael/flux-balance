/**
 * Cada color es `string`, no un literal (`as const`): light y dark tienen
 * valores distintos para la misma clave, y createTheme() debe poder
 * aceptar cualquier hex/rgba en los overrides — literal typing lo impediría.
 *
 * Cada acento viene en cuatro roles, y no son intercambiables:
 *
 *   `primary`      relleno sólido (fondo de botón, día seleccionado, FAB).
 *   `onPrimary`    texto/ícono *encima* de ese relleno.
 *   `primarySoft`  fondo teñido para estados seleccionados y pills.
 *   `primaryText`  texto/ícono del acento sobre `surface`, `background`
 *                  o sobre su propio `primarySoft`.
 */
export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primarySoft: string;
  primaryText: string;

  secondary: string;
  onSecondary: string;
  secondarySoft: string;
  secondaryText: string;

  success: string;
  onSuccess: string;
  successSoft: string;
  successText: string;

  error: string;
  onError: string;
  errorSoft: string;
  errorText: string;

  warning: string;
  onWarning: string;
  warningSoft: string;
  warningText: string;

  white: string;
  black: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
  inputBackground: string;
  overlay: string;
  /** Velo semitransparente sobre contenido propio (footer de carga de List). */
  scrim: string;
  /** Fondo de placeholder mientras carga una imagen. */
  skeleton: string;
  chartCategories: readonly [string, string, string, string, string, string];
  chartOther: string;
}

const neutral = {
  white: '#ffffff',
  black: '#000000',
};

export const lightPalette: ThemeColors = {
  ...neutral,

  primary: '#2563eb',
  onPrimary: '#ffffff',
  primarySoft: '#eff6ff',
  primaryText: '#1d4ed8',

  secondary: '#06b6d4',
  onSecondary: '#ffffff',
  secondarySoft: '#ecfeff',
  secondaryText: '#0e7490',

  success: '#10b981',
  onSuccess: '#ffffff',
  successSoft: '#ecfdf5',
  successText: '#047857',

  error: '#f43f5e',
  onError: '#ffffff',
  errorSoft: '#fff1f2',
  errorText: '#be123c',

  warning: '#f59e0b',
  onWarning: '#ffffff',
  warningSoft: '#fffbeb',
  warningText: '#b45309',

  // Gris cálido stone-50
  background: '#fafaf9',
  surface: '#ffffff',
  text: '#1c1917',
  textLight: '#78716c',
  border: '#e7e5e4',
  inputBackground: '#f5f5f4',
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(250,250,249,0.85)',
  skeleton: '#e7e5e4',
  chartCategories: ['#43627F', '#4A746A', '#8A693F', '#975750', '#66743F', '#6B5B4C'],
  chartOther: '#6E727A',
};

export const darkPalette: ThemeColors = {
  ...neutral,

  primary: '#3b82f6',
  onPrimary: '#ffffff',
  primarySoft: 'rgba(59, 130, 246, 0.15)',
  primaryText: '#60a5fa',

  secondary: '#22d3ee',
  onSecondary: '#083344',
  secondarySoft: 'rgba(34, 211, 238, 0.15)',
  secondaryText: '#38bdf8',

  // Verde esmeralda / neón vibrante
  success: '#10b981',
  onSuccess: '#022c22',
  successSoft: 'rgba(16, 185, 129, 0.16)',
  successText: '#34d399',

  // Rojo coral vibrante
  error: '#f43f5e',
  onError: '#ffffff',
  errorSoft: 'rgba(244, 63, 94, 0.16)',
  errorText: '#fb7185',

  warning: '#fbbf24',
  onWarning: '#451a03',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  warningText: '#fcd34d',

  // Gris muy oscuro zinc-950
  background: '#09090b',
  surface: '#18181b',
  text: '#fafafa',
  textLight: '#a1a1aa',
  border: '#27272a',
  inputBackground: '#121215',
  overlay: 'rgba(0,0,0,0.7)',
  scrim: 'rgba(9,9,11,0.85)',
  skeleton: '#27272a',
  chartCategories: ['#7D9BB8', '#82AC9F', '#C7A572', '#CE8C82', '#A7B57A', '#B29C87'],
  chartOther: '#9A9CA3',
};
