import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import layerMeta from '@/assets/images/logos-app/logo-splash-layers.json';
import { SPLASH_TIMELINE } from './splashTiming';

const BODY_IMAGE = require('../../../assets/images/logos-app/logo-splash-body.png');
const COIN_IMAGE = require('../../../assets/images/logos-app/logo-splash-coin.png');

export type SplashPigMode = 'story' | 'fade' | 'reduced';

const LOGO_WIDTH = 200;
const LOGO_SCALE = LOGO_WIDTH / layerMeta.source.width;
const LOGO_HEIGHT = layerMeta.source.height * LOGO_SCALE;

const BODY = {
  left: layerMeta.body.left * LOGO_SCALE,
  top: layerMeta.body.top * LOGO_SCALE,
  width: layerMeta.body.width * LOGO_SCALE,
  height: layerMeta.body.height * LOGO_SCALE,
};

const COIN = {
  left: layerMeta.coin.left * LOGO_SCALE,
  top: layerMeta.coin.top * LOGO_SCALE,
  width: layerMeta.coin.width * LOGO_SCALE,
  height: layerMeta.coin.height * LOGO_SCALE,
};

const COIN_CENTER = {
  x: COIN.left + COIN.width / 2,
  y: COIN.top + COIN.height / 2,
};

const SLOT = {
  x: layerMeta.slot.x * LOGO_SCALE,
  y: layerMeta.slot.y * LOGO_SCALE,
};

const DROP_X = SLOT.x - COIN_CENTER.x;
const DROP_Y = SLOT.y - COIN_CENTER.y;
const RING_SIZE = 40;
const RING_LEFT = SLOT.x - BODY.left - RING_SIZE / 2;
const RING_TOP = SLOT.y - BODY.top - RING_SIZE / 2;
const RING_COLOR = '#FFFFFF';
const INTRO_EASING = Easing.inOut(Easing.sin);
const INTRO_SETTLE_EASING = Easing.out(Easing.cubic);
const INTRO_WEIGHT_IN_MS = 60;
const INTRO_WEIGHT_OUT_MS = 160;
const INTRO_HOP_MS = 900;
const INTRO_COIN_MS = 1100;

function clamp01(value: number): number {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

function segment(value: number, start: number, end: number): number {
  'worklet';
  return clamp01((value - start) / (end - start));
}

function easeOutCubic(value: number): number {
  'worklet';
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value: number): number {
  'worklet';
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

function easeOutBack(value: number): number {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
}

interface SplashPigProps {
  progress: SharedValue<number>;
  mode: SplashPigMode;
  idle: boolean;
  onReady: () => void;
}

export function SplashPig({ progress, mode, idle, onReady }: SplashPigProps) {
  const [bodyLoaded, setBodyLoaded] = useState(false);
  const [coinLoaded, setCoinLoaded] = useState(false);
  const readyCalled = useRef(false);
  const breath = useSharedValue(0);
  const float = useSharedValue(0);
  const idleWeight = useSharedValue(0);

  useEffect(() => {
    if (!bodyLoaded || !coinLoaded || readyCalled.current) return;
    readyCalled.current = true;
    onReady();
  }, [bodyLoaded, coinLoaded, onReady]);

  useEffect(() => {
    if (!idle || mode !== 'story') {
      cancelAnimation(breath);
      cancelAnimation(float);
      idleWeight.set(withTiming(0, { duration: INTRO_WEIGHT_OUT_MS, easing: INTRO_SETTLE_EASING }));
      breath.set(withTiming(0, { duration: INTRO_WEIGHT_OUT_MS, easing: INTRO_SETTLE_EASING }));
      float.set(withTiming(0, { duration: INTRO_WEIGHT_OUT_MS, easing: INTRO_SETTLE_EASING }));
      return;
    }

    idleWeight.set(withTiming(1, { duration: INTRO_WEIGHT_IN_MS, easing: INTRO_SETTLE_EASING }));
    breath.set(withRepeat(withTiming(1, { duration: INTRO_HOP_MS, easing: INTRO_EASING }), -1, true));
    float.set(withRepeat(withTiming(1, { duration: INTRO_COIN_MS, easing: INTRO_EASING }), -1, true));

    return () => {
      cancelAnimation(breath);
      cancelAnimation(float);
      cancelAnimation(idleWeight);
    };
  }, [breath, float, idle, idleWeight, mode]);

  const bodyStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const weight = idleWeight.get();
    const introBob = -7 * Math.sin(Math.PI * breath.get()) * weight;
    const introTilt = 2.5 * Math.sin(2 * Math.PI * breath.get()) * weight;
    const breathe = 1 + 0.025 * breath.get() * weight;

    if (mode !== 'story') {
      return {
        opacity: 1 - p,
        transform: [{ translateY: introBob }, { rotate: `${introTilt}deg` }, { scale: breathe }],
      };
    }

    const hop = Math.sin(Math.PI * segment(p, 0, SPLASH_TIMELINE.dropEnd));
    const squash = Math.sin(
      Math.PI * segment(p, SPLASH_TIMELINE.squashStart, SPLASH_TIMELINE.squashEnd)
    );
    const inflate = easeOutBack(
      segment(p, SPLASH_TIMELINE.inflateStart, SPLASH_TIMELINE.inflateEnd)
    );
    const exit = easeInOutCubic(
      segment(p, SPLASH_TIMELINE.exitStart, SPLASH_TIMELINE.exitEnd)
    );
    const wobble =
      2 * Math.sin(
        2 * Math.PI * segment(p, SPLASH_TIMELINE.squashStart, SPLASH_TIMELINE.inflateEnd)
      ) +
      4 * exit;
    const exitScale = 1 + 0.08 * exit;

    return {
      opacity: 1 - segment(p, SPLASH_TIMELINE.bodyFadeStart, SPLASH_TIMELINE.bodyFadeEnd),
      transform: [
        { translateY: introBob - 6 * hop + 2 * squash - 28 * exit },
        { rotate: `${introTilt + wobble}deg` },
        {
          scaleX: (1 + 0.035 * squash + 0.16 * inflate) * breathe * exitScale,
        },
        {
          scaleY: (1 - 0.025 * squash + 0.16 * inflate) * breathe * exitScale,
        },
      ],
    };
  });

  const coinStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const weight = idleWeight.get();
    const introBob = -5 * Math.sin(Math.PI * float.get()) * weight;
    const introWobble = 8 * Math.sin(2 * Math.PI * float.get()) * weight;
    const introScale = 1 + 0.02 * Math.sin(Math.PI * float.get()) * weight;

    if (mode !== 'story') {
      return {
        opacity: 1 - p,
        transform: [
          { translateY: introBob },
          { rotate: `${introWobble}deg` },
          { scale: introScale },
        ],
      };
    }

    const drop = segment(p, 0, SPLASH_TIMELINE.dropEnd);
    const dropEase = drop * drop;
    const absorb = easeOutCubic(
      segment(p, SPLASH_TIMELINE.dropEnd, SPLASH_TIMELINE.absorbEnd)
    );
    const dropPop = 1 + 0.06 * Math.sin(Math.PI * drop);

    return {
      opacity: 1 - absorb,
      transform: [
        { translateX: DROP_X * dropEase },
        { translateY: DROP_Y * dropEase + introBob },
        { rotate: `${367 * dropEase + introWobble}deg` },
        { scale: dropPop * (1 - 0.08 * absorb) * introScale },
      ],
    };
  });

  const impactStyle = useAnimatedStyle(() => {
    if (mode !== 'story') {
      return { opacity: 0 };
    }

    const p = progress.get();
    const impact = easeOutCubic(segment(p, SPLASH_TIMELINE.dropEnd, SPLASH_TIMELINE.impactEnd));
    const visible = p >= SPLASH_TIMELINE.dropEnd && p < SPLASH_TIMELINE.impactEnd;

    return {
      opacity: visible ? 0.65 * (1 - impact) : 0,
      transform: [{ scale: 0.5 + 0.9 * impact }],
    };
  });

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.container}
    >
      <Animated.View style={[styles.body, bodyStyle]}>
        <Image
          source={BODY_IMAGE}
          resizeMode="stretch"
          fadeDuration={0}
          onLoadEnd={() => setBodyLoaded(true)}
          style={styles.image}
        />
        <Animated.View style={[styles.impactRing, impactStyle]} />
      </Animated.View>

      <Animated.View style={[styles.coin, coinStyle]}>
        <Image
          source={COIN_IMAGE}
          resizeMode="stretch"
          fadeDuration={0}
          onLoadEnd={() => setCoinLoaded(true)}
          style={styles.image}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  body: {
    position: 'absolute',
    left: BODY.left,
    top: BODY.top,
    width: BODY.width,
    height: BODY.height,
  },
  coin: {
    position: 'absolute',
    left: COIN.left,
    top: COIN.top,
    width: COIN.width,
    height: COIN.height,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  impactRing: {
    position: 'absolute',
    left: RING_LEFT,
    top: RING_TOP,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: RING_COLOR,
  },
});
