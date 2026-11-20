import React, { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/components/ui/theme';
import { useSplashTransition } from '@/context/SplashTransitionContext';

const ENTER_DURATION = 500;
const REDUCED_DURATION = 200;
const ENTER_EASING = Easing.out(Easing.cubic);

interface HomeRevealProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function HomeReveal({
  children,
  delay = 0,
  distance = 12,
  style,
}: HomeRevealProps) {
  const { isRevealing, revealDelay } = useSplashTransition();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(reduceMotion ? 0 : distance);

  useEffect(() => {
    if (!isRevealing) return;

    const duration = reduceMotion ? REDUCED_DURATION : ENTER_DURATION;
    const delayMs = reduceMotion ? 0 : delay + revealDelay;

    opacity.set(withDelay(delayMs, withTiming(1, { duration, easing: ENTER_EASING })));
    translateY.set(withDelay(delayMs, withTiming(0, { duration, easing: ENTER_EASING })));
  }, [delay, isRevealing, opacity, reduceMotion, revealDelay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
