import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useThemeMode } from '@/components/ui/theme';

interface BackdropBlurProps {
  visible: boolean;
  onPress: () => void;
  blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>;
}

const FADE_DURATION = 240;
const UNMOUNT_DELAY = FADE_DURATION + 40;

export function BackdropBlur({ visible, onPress, blurTarget }: BackdropBlurProps) {
  const { isDark } = useThemeMode();
  const canBlur = Boolean(blurTarget);

  const [isMounted, setIsMounted] = useState(visible);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setIsMounted(true);
  }

  useEffect(() => {
    if (visible) return;

    const timeout = setTimeout(() => setIsMounted(false), UNMOUNT_DELAY);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!isMounted) return null;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ type: 'timing', duration: FADE_DURATION } as any}
      style={[
        styles.container,
        {
          backgroundColor: canBlur
            ? 'transparent'
            : isDark
              ? 'rgba(0, 0, 0, 0.7)'
              : 'rgba(0, 0, 0, 0.24)',
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {canBlur && (
        <>
          <BlurView
            key={isDark ? 'blur-dark' : 'blur-light'}
            intensity={30}
            tint="light"
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={blurTarget}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, isDark ? styles.darkBlurOverlay : styles.lightBlurOverlay]}
          />
        </>
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
  darkBlurOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  lightBlurOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
