import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, useColorScheme } from 'react-native';
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

const SPLASH_LOGO = require('../../../assets/images/logos-app/logo-splash.png');

const LOGO_SIZE = 200;
const EXIT_DURATION = 420;
const REDUCED_EXIT_DURATION = 200;
const LOGO_EXIT_DURATION = 320;
const LOGO_READY_TIMEOUT_MS = 150;
const MAX_HOLD_MS = 2500;

const SPLASH_BACKGROUND = {
  light: '#1642AF',
  dark: '#0A0E1A',
} as const;

const EASE_OUT = Easing.out(Easing.cubic);

type Phase = 'hold' | 'exit' | 'done';

interface SplashTransitionProps {
  children: React.ReactNode;
}

export function SplashTransition({ children }: SplashTransitionProps) {
  const { isLoading } = useDashboard();
  const systemScheme = useColorScheme();
  const reduceMotion = useReduceMotion();
  const [phase, setPhase] = useState<Phase>('hold');
  const [laidOut, setLaidOut] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [nativeHidden, setNativeHidden] = useState(false);
  const [forceReveal, setForceReveal] = useState(false);
  const hideRequested = useRef(false);
  const overlayProgress = useSharedValue(0);
  const logoProgress = useSharedValue(0);
  const isRevealing = phase !== 'hold';
  const isSplashHidden = phase === 'done';

  const finish = useCallback(() => {
    setPhase('done');
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
    if (!nativeHidden || phase !== 'hold') return;

    const timer = setTimeout(() => setForceReveal(true), MAX_HOLD_MS);
    return () => clearTimeout(timer);
  }, [nativeHidden, phase]);

  useEffect(() => {
    if (!nativeHidden || phase !== 'hold' || (isLoading && !forceReveal)) return;

    const frame = requestAnimationFrame(() => {
      setPhase('exit');
      overlayProgress.set(
        withTiming(
          1,
          {
            duration: reduceMotion ? REDUCED_EXIT_DURATION : EXIT_DURATION,
            easing: EASE_OUT,
          },
          (finished) => {
            if (finished) scheduleOnRN(finish);
          }
        )
      );

      if (!reduceMotion) {
        logoProgress.set(
          withTiming(1, { duration: LOGO_EXIT_DURATION, easing: EASE_OUT })
        );
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [
    finish,
    forceReveal,
    isLoading,
    logoProgress,
    nativeHidden,
    overlayProgress,
    phase,
    reduceMotion,
  ]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1 - overlayProgress.get(),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: 1 - logoProgress.get(),
    transform: [
      { translateY: -10 * logoProgress.get() },
      { scale: 1 + 0.04 * logoProgress.get() },
    ],
  }));

  const backgroundColor =
    systemScheme === 'dark' ? SPLASH_BACKGROUND.dark : SPLASH_BACKGROUND.light;

  return (
    <SplashTransitionProvider
      isRevealing={isRevealing}
      isSplashHidden={isSplashHidden}
    >
      {children}
      {phase !== 'done' && (
        <Animated.View
          onLayout={() => setLaidOut(true)}
          style={[styles.overlay, { backgroundColor }, backgroundStyle]}
        >
          <Animated.View style={[styles.logo, logoStyle]}>
            <Image
              source={SPLASH_LOGO}
              resizeMode="contain"
              fadeDuration={0}
              onLoadEnd={() => setLogoLoaded(true)}
              style={styles.logoImage}
            />
          </Animated.View>
        </Animated.View>
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
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
