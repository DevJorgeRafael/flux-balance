/**
 * Medidas de la barra flotante. Son la única fuente de verdad para el alto de
 * la barra y para el padding que las pantallas dejan para que el contenido
 * nunca quede tapado.
 */

/** Alto de la píldora de la barra. */
export const TAB_BAR_HEIGHT = 64;

/** Separación entre la barra y el borde inferior de la pantalla. */
export const TAB_BAR_BOTTOM_MARGIN = 12;

/** Separación entre la barra y los bordes laterales de la pantalla. */
export const TAB_BAR_HORIZONTAL_MARGIN = 16;

/** Diámetro del círculo con el ＋. */
export const TAB_BAR_ACTION_SIZE = 56;

/** Separación entre la barra y el círculo con el ＋. */
export const TAB_BAR_ACTION_GAP = 12;

/** Aire que queda entre el contenido y la barra. */
export const TAB_BAR_CONTENT_GAP = 20;

/** Alto que la barra ocupa por encima del borde inferior (sin safe area). */
export const TAB_BAR_CONTENT_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN;
