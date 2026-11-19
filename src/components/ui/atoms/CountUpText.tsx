import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DEFAULT_DURATION = 1750;
const DEFAULT_DELAY = 100;
const DEFAULT_STEPS = 100;
const COUNT_UP_EASING = Easing.out(Easing.cubic);

interface CountUpTextProps extends Omit<TextProps, 'children'> {
  value: number;
  animate: boolean;
  formatValue: (value: number) => string;
  hidden?: boolean;
  hiddenText?: string;
  onStart?: () => void;
  duration?: number;
  delay?: number;
  steps?: number;
}

export function CountUpText({
  value,
  animate,
  formatValue,
  hidden = false,
  hiddenText,
  onStart,
  duration = DEFAULT_DURATION,
  delay = DEFAULT_DELAY,
  steps = DEFAULT_STEPS,
  ...textProps
}: CountUpTextProps) {
  const [displayedValue, setDisplayedValue] = useState(() => (animate ? 0 : value));
  const progress = useSharedValue(0);
  const isCounting = useSharedValue(0);
  const started = useRef(false);
  const running = useRef(false);
  const startValue = useRef(0);
  const targetValue = useRef(value);
  const latestValue = useRef(value);
  const stepCount = Math.max(1, Math.round(steps));

  useEffect(() => {
    latestValue.current = value;
    if (!running.current && (!animate || started.current)) {
      setDisplayedValue(value);
    }
  }, [animate, value]);

  const applyStep = useCallback(
    (step: number) => {
      if (step >= stepCount) {
        running.current = false;
        setDisplayedValue(latestValue.current);
        return;
      }
      const ratio = step / stepCount;
      setDisplayedValue(startValue.current + (targetValue.current - startValue.current) * ratio);
    },
    [stepCount]
  );

  useAnimatedReaction(
    () => (isCounting.get() ? Math.round(progress.get() * stepCount) : -1),
    (step, previousStep) => {
      if (step >= 0 && step !== previousStep) {
        scheduleOnRN(applyStep, step);
      }
    }
  );

  useEffect(() => {
    if (!animate || started.current) return;
    started.current = true;
    onStart?.();
    const target = latestValue.current;
    if (target === 0) {
      setDisplayedValue(0);
      return;
    }
    startValue.current = 0;
    targetValue.current = target;
    running.current = true;
    cancelAnimation(progress);
    progress.set(0);
    isCounting.set(1);
    setDisplayedValue(0);
    progress.set(
      withDelay(
        delay,
        withTiming(1, {
          duration,
          easing: COUNT_UP_EASING,
          reduceMotion: ReduceMotion.System,
        })
      )
    );
  }, [animate, delay, duration, onStart, progress, isCounting]);

  return (
    <Text {...textProps} accessibilityLabel={hidden ? undefined : formatValue(value)}>
      {hidden ? hiddenText : formatValue(displayedValue)}
    </Text>
  );
}
