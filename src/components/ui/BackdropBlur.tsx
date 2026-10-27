import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useColors, useThemeMode } from '@/components/ui/theme';

interface BackdropBlurProps {
  visible: boolean;
  onPress: () => void;
  blurTarget?: React.RefObject<any>;
}

export function BackdropBlur({ visible, onPress, blurTarget }: BackdropBlurProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();

  return (
    <MotiView
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ type: 'timing', duration: 250 } as any}
      style={[styles.container, { backgroundColor: colors.backdrop }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={blurTarget}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdropVeil }]}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});

