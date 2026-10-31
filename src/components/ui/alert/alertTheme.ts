import { createTheme } from '../theme/createTheme';
import { darkPalette, lightPalette } from '../theme/palettes';
import { radius } from '../theme/tokens';

/**
 * Tema exclusivo del Alert: usa la superficie elevada de la app y el radio de
 * card (24), sin alterar el tema que consumen las pantallas.
 */
export const alertTheme = createTheme({
  colors: {
    light: { surface: lightPalette.cardRaised },
    dark: { surface: darkPalette.cardRaised },
  },
  tokens: {
    radius: { xl: radius.card },
  },
});
