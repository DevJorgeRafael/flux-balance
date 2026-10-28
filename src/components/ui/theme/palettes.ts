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
  /** Superficie de la hoja inferior del Dashboard. */
  sheet: string;
  /** Superficie elevada: resumen, chips, botones secundarios y cuenta activa. */
  cardRaised: string;
  /**
   * Controles internos (chips, cajas de íconos, opciones sin seleccionar).
   * En claro conserva el gris de fondo; en oscuro sube a cardRaised para no
   * quedar más oscuro que la tarjeta que lo contiene.
   */
  surfaceMuted: string;
  /**
   * Fondo de controles segmentados (por ejemplo, el selector Ingresos/Gastos).
   * En claro es más oscuro que `inputBackground` para que el control no parezca
   * deshabilitado; en oscuro mantiene la superficie elevada.
   */
  controlTrack: string;
  /** Superficie de hojas modales. En oscuro comparte el nivel de `sheet`. */
  modal: string;
  text: string;
  textLight: string;
  border: string;
  inputBackground: string;
  overlay: string;
  /** Velo semitransparente sobre contenido propio (footer de carga de List). */
  scrim: string;
  /** Fondo de placeholder mientras carga una imagen. */
  skeleton: string;
  chartOther: string;
  /** Color base de las sombras; los componentes lo aplican con su opacidad. */
  shadow: string;
  /** Texto e íconos que se dibujan sobre el héroe del Dashboard. */
  onHero: string;
  /** Tinte del fondo detrás de un modal. */
  backdrop: string;
  /** Velo adicional que oscurece el backdrop en modo oscuro. */
  backdropVeil: string;
  /** Fondo del check sobre una muestra de color de categoría. */
  swatchBadge: string;
  /** Velo translúcido sobre botones de acento (círculos de íconos). */
  onAccentMuted: string;
}

export const neutral = {
  white: '#ffffff',
  black: '#000000',
};

/** Candidatos de texto para fondos de color arbitrarios (categorías). */
export const readableTextCandidates = {
  light: '#ffffff',
  dark: '#0b1020',
} as const;

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
  sheet: '#E6E9EF',
  cardRaised: '#ffffff',
  surfaceMuted: '#fafaf9',
  controlTrack: '#e7e5e4',
  modal: '#ffffff',
  text: '#1c1917',
  textLight: '#78716c',
  border: '#e7e5e4',
  inputBackground: '#f5f5f4',
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(250,250,249,0.85)',
  skeleton: '#e7e5e4',
  chartOther: '#6E727A',
  shadow: '#000000',
  onHero: '#ffffff',
  backdrop: 'rgba(255,255,255,0.12)',
  backdropVeil: 'transparent',
  swatchBadge: 'rgba(0,0,0,0.3)',
  onAccentMuted: 'rgba(255,255,255,0.22)',
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

  // Familia azul marino: la luminosidad sube con cada nivel de elevación.
  background: '#0A0E1A',
  surface: '#18203A',
  sheet: '#101626',
  cardRaised: '#212B4A',
  surfaceMuted: '#212B4A',
  controlTrack: '#18203A',
  modal: '#101626',
  text: '#F2F4F8',
  textLight: '#8F9BB8',
  border: '#2A3555',
  inputBackground: '#18203A',
  overlay: 'rgba(3, 6, 15, 0.72)',
  scrim: 'rgba(10, 14, 26, 0.85)',
  skeleton: '#1B2440',
  chartOther: '#8F9BB8',
  shadow: '#000000',
  onHero: '#F2F4F8',
  backdrop: 'rgba(4, 8, 18, 0.24)',
  backdropVeil: 'rgba(4, 8, 18, 0.45)',
  swatchBadge: 'rgba(0,0,0,0.3)',
  onAccentMuted: 'rgba(255,255,255,0.22)',
};
