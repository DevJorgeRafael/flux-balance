import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CreditCard,
  Home,
  Plus,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useColors, useThemeMode } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { TAB_BAR_HEIGHT, TAB_BAR_OVERHANG } from './tabBarLayout';

type TabName = 'index' | 'accounts' | 'settings';

interface TabDefinition {
  name: TabName;
  label: string;
  icon: LucideIcon;
}

interface TabButtonProps {
  label: string;
  icon: LucideIcon;
  focused: boolean;
  color: string;
  onPress: () => void;
}

function TabButton({ label, icon: Icon, focused, color, onPress }: TabButtonProps) {
  return (
    <Pressable
      style={styles.tabButton}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AppTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();
  const { openTransactionModal } = useDashboard();

  const tabs: TabDefinition[] = [
    { name: 'index', label: t('home'), icon: Home },
    { name: 'accounts', label: t('accountsTab'), icon: CreditCard },
    { name: 'settings', label: t('settings'), icon: SettingsIcon },
  ];

  const activeRouteName = state.routes[state.index]?.name;
  const surfaceHeight = TAB_BAR_HEIGHT + insets.bottom;

  const renderTab = (tab: TabDefinition) => {
    const route = state.routes.find((item) => item.name === tab.name);
    if (!route) return null;

    const focused = activeRouteName === tab.name;
    return (
      <TabButton
        key={tab.name}
        label={tab.label}
        icon={tab.icon}
        focused={focused}
        color={focused ? colors.primaryText : colors.textLight}
        onPress={() => navigateToTab(route.key)}
      />
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { height: TAB_BAR_OVERHANG + surfaceHeight }]}
    >
      <View
        pointerEvents="auto"
        style={[
          styles.surface,
          {
            top: TAB_BAR_OVERHANG,
            height: surfaceHeight,
            backgroundColor: colors.surface,
            shadowOpacity: isDark ? 0.45 : 0.1,
          },
        ]}
      >
        <View style={[styles.row, { height: surfaceHeight, paddingBottom: insets.bottom }]}>
          <View style={styles.sideGroup}>
            {renderTab(tabs[0])}
            {renderTab(tabs[1])}
          </View>

          <View style={styles.centerSpacer} />

          <View style={styles.sideGroup}>{renderTab(tabs[2])}</View>
        </View>
      </View>

      <View pointerEvents="box-none" style={styles.plusLayer}>
        <Pressable
          onPress={() => openTransactionModal('EXPENSE')}
          accessibilityRole="button"
          accessibilityLabel={t('newMovement')}
          style={({ pressed }) => [
            styles.plusButton,
            {
              backgroundColor: colors.primary,
              shadowOpacity: isDark ? 0.5 : 0.24,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Plus size={28} color={colors.onPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>
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
  surface: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  centerSpacer: {
    width: 76,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  plusLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
  },
});
