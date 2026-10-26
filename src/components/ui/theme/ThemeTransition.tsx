import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { defaultTheme } from './createTheme';
import { useThemeMode } from './UIProvider';

interface ThemeTransitionContextValue {
  toggleThemeAnimated: (originX: number, originY: number) => void;
}

const ThemeTransitionContext = createContext<ThemeTransitionContextValue | undefined>(undefined);

interface RevealState {
  x: number;
  y: number;
  radius: number;
  background: string;
}

const COVER_DURATION = 420;
const FADE_DURATION = 240;

export function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  const { isDark, setMode } = useThemeMode();
  const { width, height } = useWindowDimensions();
  const [reveal, setReveal] = useState<RevealState | null>(null);

  const cover = useSharedValue(0);
  const fade = useSharedValue(1);
  const isBusy = useRef(false);
  const pendingMode = useRef<'light' | 'dark' | null>(null);

  const finish = useCallback(() => {
    setReveal(null);
    pendingMode.current = null;
    isBusy.current = false;
  }, []);

  const commitTheme = useCallback(() => {
    const next = pendingMode.current;
    if (!next) return;

    setMode(next);

    setTimeout(() => {
      fade.set(
        withTiming(
          0,
          { duration: FADE_DURATION, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (finished) runOnJS(finish)();
          }
        )
      );
    }, 40);
  }, [finish, fade, setMode]);

  const toggleThemeAnimated = useCallback(
    (originX: number, originY: number) => {
      if (isBusy.current) return;

      const next = isDark ? 'light' : 'dark';
      const radius = Math.hypot(width, height);

      isBusy.current = true;
      pendingMode.current = next;
      cover.set(0);
      fade.set(1);
      setReveal({
        x: originX,
        y: originY,
        radius,
        background: defaultTheme[next].colors.background,
      });
    },
    [cover, fade, height, isDark, width]
  );

  useEffect(() => {
    if (!reveal) return;

    cover.set(
      withTiming(
        1,
        { duration: COVER_DURATION, easing: Easing.bezier(0.65, 0, 0.35, 1) },
        (finished) => {
          if (finished) runOnJS(commitTheme)();
        }
      )
    );
  }, [commitTheme, cover, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ scale: cover.get() }],
  }));

  return (
    <ThemeTransitionContext.Provider value={{ toggleThemeAnimated }}>
      <View style={styles.container}>
        {children}
        {reveal && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.reveal,
              {
                left: reveal.x - reveal.radius,
                top: reveal.y - reveal.radius,
                width: reveal.radius * 2,
                height: reveal.radius * 2,
                borderRadius: reveal.radius,
                backgroundColor: reveal.background,
              },
              revealStyle,
            ]}
          />
        )}
      </View>
    </ThemeTransitionContext.Provider>
  );
}

export function useThemeTransition(): ThemeTransitionContextValue {
  const ctx = useContext(ThemeTransitionContext);
  if (!ctx) {
    throw new Error('useThemeTransition must be used within a ThemeTransitionProvider.');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reveal: {
    position: 'absolute',
    zIndex: 999,
    elevation: 999,
  },
});
