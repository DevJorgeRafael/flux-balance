import {
  CATEGORY_COLOR_PALETTES,
  type CategoryColorPalette,
} from '@/core/constants/categoryPalettes';

export { CATEGORY_COLOR_PALETTES as categoryPalettes };
export type { CategoryColorPalette };

// Las escalas numéricas se tipan explícitamente como `number` (no `as const`):
// createTheme() debe poder sobreescribir cualquier valor con otro número
// arbitrario: con literal typing, un override de `radius.md` a `999` fallaría
// porque el tipo inferido sería el literal `8`, no `number`.

/**
 * Escala de espaciado. Usar siempre estos valores en vez de números mágicos
 * para que el ritmo vertical/horizontal sea consistente entre componentes.
 */
export const spacing: Record<'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl', number> = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'card' | 'full', number> = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  /** Radio de todas las cards de la app (referencia: Ajustes). */
  card: 24,
  full: 9999,
};

export const fontSize: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number> = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
};

// fontWeight sí necesita literales: TextStyle.fontWeight de RN exige un union
// de strings específicos ('400' | '500' | ...), no `string` arbitrario.
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/** Duraciones en ms para Animated.timing/spring. */
export const duration: Record<'fast' | 'base' | 'slow', number> = {
  fast: 150,
  base: 200,
  slow: 250,
};

export interface CardShadowToken {
  /** Desplazamiento vertical de la sombra. */
  offsetY: number;
  /** Radio de difuminado de la sombra. */
  blur: number;
  opacityLight: number;
  opacityDark: number;
}

/**
 * Sombra única de la app: difusa, suave y sin capas apiladas. El color sale
 * de `colors.shadow` del tema, así que aquí solo viven los valores numéricos.
 */
export const cardShadow: CardShadowToken = {
  offsetY: 8,
  blur: 24,
  opacityLight: 0.16,
  opacityDark: 0.42,
};

/**
 * Sombra compacta para superficies pequeñas (cards de cuentas, chips) donde
 * la difusa grande se desborda del espacio disponible y se corta.
 */
export const cardShadowSm: CardShadowToken = {
  offsetY: 2,
  blur: 6,
  opacityLight: 0.12,
  opacityDark: 0.28,
};

export interface HeroGradientToken {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Fondos del balance del Dashboard. El modo oscuro mantiene un azul marino
 * profundo casi plano hasta el 72% de la altura; el último tramo se oscurece
 * apenas para fundirse con la hoja, sin llegar al negro.
 */
export const heroGradientLight: HeroGradientToken = {
  colors: ['#2A5BE0', '#1A46C4'],
  locations: [0, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const heroGradientDark: HeroGradientToken = {
  colors: ['#17399A', '#153690', '#112A72', '#0D2158'],
  locations: [0, 0.72, 0.86, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const tokens = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  duration,
  cardShadow,
  categoryPalettes: CATEGORY_COLOR_PALETTES,
  heroGradientLight,
  heroGradientDark,
};

export type Tokens = typeof tokens;
