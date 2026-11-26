import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useInsets, withAlpha } from '@/components/ui/theme';
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';

const GRADIENT_HEIGHT = 48;

/** Color transparente del mismo RGB: evita el velo gris que produce `transparent`. */
function toTransparent(color: string): string {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, '0)');
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', ', 0)');
  }
  return withAlpha(color, 0);
}

interface BottomFadeProps {
  /** Color visible en el borde inferior. Por defecto, el fondo del tema. */
  color?: string;
}

/**
 * Degradado del borde inferior de una pantalla: se vuelve opaco antes de
 * llegar a la barra flotante para que el contenido nunca se vea cortado
 * detrás de ella.
 */
export function BottomFade({ color }: BottomFadeProps) {
  const colors = useColors();
  const insets = useInsets();
  const baseColor = color ?? colors.background;
  const barZone = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + insets.bottom;
  const totalHeight = barZone + GRADIENT_HEIGHT;

  return (
    <View pointerEvents="none" style={[styles.fade, { height: totalHeight }]}>
      <LinearGradient
        colors={[toTransparent(baseColor), baseColor, baseColor]}
        locations={[0, GRADIENT_HEIGHT / totalHeight, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  gradient: {
    flex: 1,
  },
});
