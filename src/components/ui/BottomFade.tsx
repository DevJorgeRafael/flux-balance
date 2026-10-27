import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, withAlpha } from '@/components/ui/theme';

const FADE_HEIGHT = 24;

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
 * Degradado del borde inferior de una pantalla: del color de fondo a
 * transparente, para que el contenido que pasa por debajo de la barra
 * flotante no se vea cortado de golpe.
 */
export function BottomFade({ color }: BottomFadeProps) {
  const colors = useColors();
  const baseColor = color ?? colors.background;

  return (
    <View pointerEvents="none" style={styles.fade}>
      <LinearGradient
        colors={[toTransparent(baseColor), baseColor]}
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
    height: FADE_HEIGHT,
    zIndex: 5,
  },
  gradient: {
    flex: 1,
  },
});
