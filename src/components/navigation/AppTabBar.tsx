import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Plus, type LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useThemeMode, withAlpha } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { APP_TABS } from './tabConfig';
import {
  TAB_BAR_ACTION_GAP,
  TAB_BAR_ACTION_SIZE,
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_CONTENT_OFFSET,
  TAB_BAR_HEIGHT,
  TAB_BAR_HORIZONTAL_MARGIN,
} from './tabBarLayout';

const BAR_OPACITY = 0.94;
/** Tinte del acento para la píldora del tab activo en modo claro. */
const ACTIVE_PILL_TINT = 0.15;
const KEYBOARD_ANIMATION_DURATION = 180;
const PILL_ANIMATION_DURATION = 220;

function getFloatingShadow(isDark: boolean, shadowColor: string): ViewStyle {
  if (Platform.OS === 'android') {
    return {
      boxShadow: isDark
        ? `0px 6px 18px ${withAlpha(shadowColor, 0.6)}`
        : `0px 6px 16px ${withAlpha(shadowColor, 0.16)}`,
    };
  }

  return {
    shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.5 : 0.16,
    shadowRadius: 16,
  };
}

interface TabButtonProps {
  label: string;
  icon: LucideIcon;
  focused: boolean;
  accentColor: string;
  inactiveColor: string;
  pillColor: string;
  onPress: () => void;
}

function TabButton({
  label,
  icon: Icon,
  focused,
  accentColor,
  inactiveColor,
  pillColor,
  onPress,
}: TabButtonProps) {
  return (
    <Animated.View layout={LinearTransition.duration(PILL_ANIMATION_DURATION)} style={styles.tab}>
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={({ pressed }) => [styles.tabPressable, pressed && styles.tabPressed]}
      >
        {focused && (
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(140)}
            style={[styles.tabPill, { backgroundColor: pillColor }]}
          />
        )}

        <View style={styles.tabContent}>
          <Icon
            size={21}
            color={focused ? accentColor : inactiveColor}
            strokeWidth={focused ? 2.4 : 2}
          />

          {focused && (
            <Animated.Text
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              numberOfLines={1}
              style={[styles.tabLabel, { color: accentColor }]}
            >
              {label}
            </Animated.Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();
  const { openTransactionModal } = useDashboard();
  const insets = useSafeAreaInsets();

  const activeRouteName = state.routes[state.index]?.name;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const hiddenOffset = TAB_BAR_CONTENT_OFFSET + insets.bottom;
    translateY.value = withTiming(isKeyboardVisible ? hiddenOffset : 0, {
      duration: KEYBOARD_ANIMATION_DURATION,
    });
    opacity.value = withTiming(isKeyboardVisible ? 0 : 1, {
      duration: KEYBOARD_ANIMATION_DURATION,
    });
  }, [insets.bottom, isKeyboardVisible, opacity, translateY]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pillColor = isDark ? colors.cardRaised : withAlpha(colors.primary, ACTIVE_PILL_TINT);
  const barColor = withAlpha(colors.surface, BAR_OPACITY);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.row,
          { paddingBottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN },
          animatedRowStyle,
        ]}
      >
        <View
          style={[
            styles.bar,
            { backgroundColor: barColor },
            getFloatingShadow(isDark, colors.shadow),
          ]}
        >
          {APP_TABS.map((tab) => {
            const route = state.routes.find((item) => item.name === tab.route);
            if (!route) return null;

            return (
              <TabButton
                key={tab.route}
                label={t(tab.labelKey)}
                icon={tab.icon}
                focused={activeRouteName === tab.route}
                accentColor={colors.primaryText}
                inactiveColor={colors.textLight}
                pillColor={pillColor}
                onPress={() => navigateToTab(route.key)}
              />
            );
          })}
        </View>

        <Pressable
          onPress={() => openTransactionModal('EXPENSE')}
          accessibilityRole="button"
          accessibilityLabel={t('newMovement')}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.primary },
            getFloatingShadow(isDark, colors.shadow),
            pressed && styles.actionPressed,
          ]}
        >
          <Plus size={28} color={colors.onPrimary} strokeWidth={2.6} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: TAB_BAR_ACTION_GAP,
    paddingHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
  },
  bar: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  tabPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  action: {
    width: TAB_BAR_ACTION_SIZE,
    height: TAB_BAR_ACTION_SIZE,
    borderRadius: TAB_BAR_ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: {
    transform: [{ scale: 0.94 }],
  },
});
