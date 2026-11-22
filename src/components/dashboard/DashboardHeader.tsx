import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Sun from 'lucide-react-native/icons/sun';
import Moon from 'lucide-react-native/icons/moon';
import Settings from 'lucide-react-native/icons/settings';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Languages from 'lucide-react-native/icons/languages';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

interface DashboardHeaderProps {
  isSettingsOpen: boolean;
  isDevMode: boolean;
  isDark: boolean;
  language: 'es' | 'en';
  themeButtonRef?: React.RefObject<any> | null;
  toggleSettings: () => void;
  closeSettings: () => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  handleSeedDemoData: () => void;
  handleResetAllData: () => void;
}

export function DashboardHeader({
  isSettingsOpen,
  isDevMode,
  isDark,
  language,
  themeButtonRef,
  toggleSettings,
  closeSettings,
  toggleTheme,
  toggleLanguage,
  handleSeedDemoData,
  handleResetAllData,
}: DashboardHeaderProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const popover = useSharedValue(isSettingsOpen ? 1 : 0);

  useEffect(() => {
    popover.set(
      withSpring(isSettingsOpen ? 1 : 0, {
        damping: 18,
        stiffness: 260,
        mass: 0.7,
      })
    );
  }, [isSettingsOpen, popover]);

  const popoverStyle = useAnimatedStyle(() => {
    const value = popover.get();
    return {
      opacity: value,
      transform: [{ scale: 0.82 + 0.18 * value }, { translateY: -8 * (1 - value) }],
    };
  });

  return (
    <>
      <View style={styles.topHeader} pointerEvents="box-none">
        <View style={styles.topHeaderSpacer} />
        <View style={styles.topHeaderActions}>
          <Pressable
            style={({ pressed }) => [
              styles.gearMainBtn,
              {
                backgroundColor: isSettingsOpen ? colors.primarySoft : colors.surface,
                borderColor: isSettingsOpen ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
            onPress={toggleSettings}
            accessibilityRole="button"
            accessibilityLabel={t('settings')}
            accessibilityState={{ expanded: isSettingsOpen }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Settings
              size={20}
              color={isSettingsOpen ? colors.primaryText : colors.text}
              strokeWidth={2}
            />
          </Pressable>

          <Animated.View
            style={[styles.settingsPopoverMotion, popoverStyle]}
            pointerEvents={isSettingsOpen ? 'auto' : 'none'}
            accessibilityElementsHidden={!isSettingsOpen}
            importantForAccessibility={isSettingsOpen ? 'auto' : 'no-hide-descendants'}
          >
            <Card variant="raised" style={styles.settingsPopover}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings')}</Text>

              <View style={[styles.menuRow, { borderTopColor: colors.border }]}>
                <View style={styles.menuRowLabel}>
                  {isDark ? (
                    <Moon size={17} color={colors.primaryText} />
                  ) : (
                    <Sun size={17} color={colors.primaryText} />
                  )}
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{t('theme')}</Text>
                </View>
                <Pressable
                  ref={themeButtonRef}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    { backgroundColor: colors.primarySoft },
                    pressed && styles.pressed,
                  ]}
                  onPress={toggleTheme}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('theme')}: ${isDark ? t('dark') : t('light')}`}
                  hitSlop={2}
                >
                  <Text style={[styles.toggleText, { color: colors.primaryText }]}>
                    {isDark ? t('dark') : t('light')}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.menuRow, { borderTopColor: colors.border }]}>
                <View style={styles.menuRowLabel}>
                  <Languages size={17} color={colors.primaryText} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{t('language')}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.toggleButton,
                    { backgroundColor: colors.primarySoft },
                    pressed && styles.pressed,
                  ]}
                  onPress={toggleLanguage}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('language')}: ${language.toUpperCase()}`}
                  hitSlop={2}
                >
                  <Text style={[styles.toggleText, { color: colors.primaryText }]}>
                    {language.toUpperCase()}
                  </Text>
                </Pressable>
              </View>

              {isDevMode && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionRow,
                    { borderTopColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    closeSettings();
                    handleSeedDemoData();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('demoMode')}
                >
                  <Sparkles size={17} color={colors.primaryText} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{t('demoMode')}</Text>
                </Pressable>
              )}

              {isDevMode && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionRow,
                    { borderTopColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    closeSettings();
                    handleResetAllData();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('resetData')}
                >
                  <RotateCcw size={17} color={colors.errorText} />
                  <Text style={[styles.menuLabel, { color: colors.errorText }]}>{t('resetData')}</Text>
                </Pressable>
              )}
            </Card>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
    zIndex: 100,
  },
  topHeaderSpacer: {
    flex: 1,
  },
  topHeaderActions: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 101,
  },
  settingsPopoverMotion: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 224,
    transformOrigin: 'top right',
  },
  settingsPopover: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  menuRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 4,
  },
  menuRowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 4,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleButton: {
    minWidth: 58,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gearMainBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
