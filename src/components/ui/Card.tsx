import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cardShadow, cardShadowSm, radius, useColors, useThemeMode, withAlpha } from '@/components/ui/theme';

export type CardVariant = 'default' | 'raised' | 'flat';
export type CardShadowSize = 'sm' | 'md';

export interface CardProps {
  children: React.ReactNode;
  /**
   * `default`: superficie con borde, sin sombra (referencia: Ajustes).
   * `raised`: además, sombra suave difusa y fondo `cardRaised` en oscuro.
   * `flat`: sin borde ni sombra, para superficies internas.
   */
  variant?: CardVariant;
  /**
   * Tamaño de la sombra de la variante `raised`.
   * `md`: difusa, para superficies grandes (resumen, popovers).
   * `sm`: compacta, para cards pequeñas donde la difusa se corta (cuentas).
   */
  shadowSize?: CardShadowSize;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Card base de la app. Todo el radio, fondo, borde y sombra salen de los
 * tokens del tema, así que claro y oscuro se ven iguales.
 *
 * La sombra vive en el mismo View que la superficie —nunca en una capa
 * aparte— y ese View no lleva `overflow: 'hidden'`, que es lo que recortaba
 * la sombra y dejaba la franja rara debajo de las cards.
 */
export function Card({
  children,
  variant = 'default',
  shadowSize = 'md',
  onPress,
  style,
  backgroundColor,
  borderColor,
  borderWidth,
  borderStyle = 'solid',
}: CardProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();

  const hasShadow = variant === 'raised';
  const shadowToken = shadowSize === 'sm' ? cardShadowSm : cardShadow;
  const surfaceColor =
    backgroundColor ?? (variant === 'raised' ? colors.cardRaised : colors.surface);
  const resolvedBorderWidth = variant === 'flat' ? 0 : (borderWidth ?? 1);
  const resolvedBorderColor = borderColor ?? colors.border;

  const shadowStyle: ViewStyle | null = hasShadow
    ? Platform.select({
        android: {
          boxShadow: `0px ${shadowToken.offsetY}px ${shadowToken.blur}px ${withAlpha(
            colors.shadow,
            isDark ? shadowToken.opacityDark : shadowToken.opacityLight
          )}`,
        },
        default: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: shadowToken.offsetY },
          shadowOpacity: isDark ? shadowToken.opacityDark : shadowToken.opacityLight,
          shadowRadius: shadowToken.blur,
        },
      }) ?? null
    : null;

  const cardStyles: StyleProp<ViewStyle> = [
    {
      borderRadius: radius.card,
      backgroundColor: surfaceColor,
      borderColor: resolvedBorderColor,
      borderWidth: resolvedBorderWidth,
      borderStyle,
    },
    hasShadow ? null : styles.clip,
    shadowStyle,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [cardStyles, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
});
