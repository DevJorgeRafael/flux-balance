import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useThemeMode } from '@/components/ui/theme';

interface BackdropBlurProps {
  visible: boolean;
  onPress: () => void;
  blurTarget?: React.RefObject<any>;
}

export function BackdropBlur({ visible, onPress, blurTarget }: BackdropBlurProps) {
  const { isDark } = useThemeMode();

  return (
    <MotiView
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ type: 'timing', duration: 250 } as any}
      style={[
        styles.container,
        { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.24)' : 'rgba(255, 255, 255, 0.12)' },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={blurTarget}
        style={StyleSheet.absoluteFill}
      />
      {isDark && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.darkOverlay]}
        />
      )}
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  darkOverlay: {
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
});

