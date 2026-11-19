import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as SplashScreen from 'expo-splash-screen';
import { useReduceMotion } from '@/components/ui/theme';
import { useDashboard } from '@/context/DashboardContext';
import { SplashTransitionProvider } from '@/context/SplashTransitionContext';
import { SplashPig, type SplashPigMode } from './SplashPig';
import {
  HOME_REVEAL_DELAY_MS,
  NATIVE_HANDOFF_MS,
  SPLASH_FADE_DURATION_MS,
  SPLASH_INTRO_MS,
  SPLASH_REDUCED_EXIT_MS,
  SPLASH_STORY_DURATION_MS,
  SPLASH_TIMELINE,
} from './splashTiming';

const LOGO_READY_TIMEOUT_MS = 75;
const MAX_HOLD_MS = 2500;

const SPLASH_BACKGROUND = {
  light: '#1642AF',
  dark: '#0A0E1A',
} as const;

type Phase = 'hold' | 'exit' | 'done';

interface SplashTransitionProps {
  children: React.ReactNode;
}

function clamp01(value: number): number {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

function segment(value: number, start: number, end: number): number {
  'worklet';
  return clamp01((value - start) / (end - start));
}

function easeInOutCubic(value: number): number {
  'worklet';
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

export function SplashTransition({ children }: SplashTransitionProps) {
  const { isLoading } = useDashboard();
  const systemScheme = useColorScheme();
  const reduceMotion = useReduceMotion();
  const [phase, setPhase] = useState<Phase>('hold');
  const [exitMode, setExitMode] = useState<SplashPigMode>('story');
  const [laidOut, setLaidOut] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [nativeHidden, setNativeHidden] = useState(false);
  const [handoffReady, setHandoffReady] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [forceReveal, setForceReveal] = useState(false);
  const hideRequested = useRef(false);
  const progress = useSharedValue(0);
  const isRevealing = phase !== 'hold';
  const isSplashHidden = phase === 'done';
  const revealDelay = isRevealing && exitMode === 'story' ? HOME_REVEAL_DELAY_MS : 0;
  const pigMode: SplashPigMode = phase === 'exit' ? exitMode : 'story';
  const intro = phase === 'hold' && laidOut && !forceReveal && !reduceMotion;

  const finish = useCallback(() => {
    setPhase('done');
  }, []);

  const handlePigReady = useCallback(() => {
    setLogoLoaded(true);
  }, []);

  useEffect(() => {
    if (!laidOut || logoLoaded || phase !== 'hold') return;

    const timer = setTimeout(() => setLogoLoaded(true), LOGO_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [laidOut, logoLoaded, phase]);

  useEffect(() => {
    if (!laidOut || !logoLoaded || hideRequested.current) return;

    const frame = requestAnimationFrame(() => {
      if (hideRequested.current) return;
      hideRequested.current = true;
      SplashScreen.hide();
      setNativeHidden(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [laidOut, logoLoaded]);

  useEffect(() => {
    if (!nativeHidden) return;

    const timer = setTimeout(() => setHandoffReady(true), NATIVE_HANDOFF_MS);
    return () => clearTimeout(timer);
  }, [nativeHidden]);

  useEffect(() => {
    if (!nativeHidden || phase !== 'hold') return;

    const timer = setTimeout(() => setForceReveal(true), MAX_HOLD_MS);
    return () => clearTimeout(timer);
  }, [nativeHidden, phase]);

  useEffect(() => {
    if (!handoffReady || phase !== 'hold' || reduceMotion) return;

    const timer = setTimeout(() => setIntroReady(true), SPLASH_INTRO_MS);
    return () => clearTimeout(timer);
  }, [handoffReady, phase, reduceMotion]);

  useEffect(() => {
    if (
      !handoffReady ||
      phase !== 'hold' ||
      (!introReady && !forceReveal && !reduceMotion) ||
      (isLoading && !forceReveal)
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const mode: SplashPigMode = reduceMotion
        ? 'reduced'
        : forceReveal
          ? 'fade'
          : 'story';
      const duration =
        mode === 'story'
          ? SPLASH_STORY_DURATION_MS
          : mode === 'fade'
            ? SPLASH_FADE_DURATION_MS
            : SPLASH_REDUCED_EXIT_MS;

      setExitMode(mode);
      setPhase('exit');
      progress.set(
        withTiming(1, { duration, easing: Easing.linear }, (finished) => {
          if (finished) scheduleOnRN(finish);
        })
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [
    finish,
    forceReveal,
    handoffReady,
    introReady,
    isLoading,
    phase,
    progress,
    reduceMotion,
  ]);

  const backgroundStyle = useAnimatedStyle(() => {
    const p = progress.get();

    if (exitMode !== 'story') {
      return { opacity: 1 - p };
    }

    return {
      opacity:
        1 -
        easeInOutCubic(
          segment(p, SPLASH_TIMELINE.backgroundFadeStart, SPLASH_TIMELINE.backgroundFadeEnd)
        ),
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    if (exitMode !== 'story') {
      return { opacity: 0 };
    }

    const flash = Math.sin(
      Math.PI * segment(progress.get(), SPLASH_TIMELINE.dropEnd, SPLASH_TIMELINE.impactEnd)
    );
    return { opacity: 0.1 * flash };
  });

  const backgroundColor =
    systemScheme === 'dark' ? SPLASH_BACKGROUND.dark : SPLASH_BACKGROUND.light;

  return (
    <SplashTransitionProvider
      isRevealing={isRevealing}
      isSplashHidden={isSplashHidden}
      revealDelay={revealDelay}
    >
      {children}
      {phase !== 'done' && (
        <View
          onLayout={() => setLaidOut(true)}
          style={styles.overlay}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.background, { backgroundColor }, backgroundStyle]}
          />
          <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
          <SplashPig
            progress={progress}
            mode={pigMode}
            idle={intro}
            onReady={handlePigReady}
          />
        </View>
      )}
    </SplashTransitionProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
});
