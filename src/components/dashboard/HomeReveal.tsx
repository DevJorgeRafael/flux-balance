import React, { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useReduceMotion } from '@/components/ui/theme';
import { useSplashTransition } from '@/context/SplashTransitionContext';

const ENTER_DURATION = 500;
const REDUCED_DURATION = 200;
const ENTER_EASING = Easing.out(Easing.cubic);
const REVEALED = { opacity: 1, translateY: 0 };

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
  const { isRevealing } = useSplashTransition();
  const reduceMotion = useReduceMotion();
  const hidden = useMemo(
    () => ({ opacity: 0, translateY: reduceMotion ? 0 : distance }),
    [distance, reduceMotion]
  );
  const transition = useMemo(
    () =>
      ({
        type: 'timing',
        duration: reduceMotion ? REDUCED_DURATION : ENTER_DURATION,
        delay: reduceMotion ? 0 : delay,
        easing: ENTER_EASING,
      }) as any,
    [delay, reduceMotion]
  );

  return (
    <MotiView
      from={hidden}
      animate={isRevealing ? REVEALED : hidden}
      transition={transition}
      style={style}
    >
      {children}
    </MotiView>
  );
}
