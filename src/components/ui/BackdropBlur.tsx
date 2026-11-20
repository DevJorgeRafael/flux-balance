import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useThemeMode } from '@/components/ui/theme';

interface BackdropBlurProps {
  visible: boolean;
  onPress: () => void;
  blurTarget?: React.RefObject<any>;
}

export function BackdropBlur({ visible, onPress, blurTarget }: BackdropBlurProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.set(withTiming(visible ? 1 : 0, { duration: 250 }));
  }, [opacity, visible]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.backdrop }, animatedStyle]}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});

