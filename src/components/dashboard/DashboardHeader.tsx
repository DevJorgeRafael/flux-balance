import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Sun, Moon, Settings, RotateCcw, Sparkles, Languages } from 'lucide-react-native';
import { MotiView } from 'moti';
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

  return (
    <>
      <View style={styles.topHeader} pointerEvents="box-none">
        <View style={styles.topHeaderSpacer} />
        <View style={styles.topHeaderActions}>
          <TouchableOpacity
            style={[
              styles.gearMainBtn,
              {
                backgroundColor: isSettingsOpen ? colors.primarySoft : colors.surface,
                borderColor: isSettingsOpen ? colors.primary : colors.border,
              },
            ]}
            onPress={toggleSettings}
            activeOpacity={0.7}
            accessibilityLabel={t('settings')}
          >
            <Settings
              size={20}
              color={isSettingsOpen ? colors.primaryText : colors.text}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, scale: 0.82, translateY: -8 }}
            animate={{
              opacity: isSettingsOpen ? 1 : 0,
              scale: isSettingsOpen ? 1 : 0.82,
              translateY: isSettingsOpen ? 0 : -8,
            }}
            transition={{ type: 'spring', damping: 18, stiffness: 260, mass: 0.7 } as any}
            style={[styles.settingsPopoverMotion]}
            pointerEvents={isSettingsOpen ? 'auto' : 'none'}
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
                <TouchableOpacity
                  ref={themeButtonRef}
                  style={[styles.toggleButton, { backgroundColor: colors.primarySoft }]}
                  onPress={toggleTheme}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.toggleText, { color: colors.primaryText }]}>
                    {isDark ? t('dark') : t('light')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.menuRow, { borderTopColor: colors.border }]}>
                <View style={styles.menuRowLabel}>
                  <Languages size={17} color={colors.primaryText} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{t('language')}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, { backgroundColor: colors.primarySoft }]}
                  onPress={toggleLanguage}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.toggleText, { color: colors.primaryText }]}>
                    {language.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              {isDevMode && (
                <TouchableOpacity
                  style={[styles.actionRow, { borderTopColor: colors.border }]}
                  onPress={() => {
                    closeSettings();
                    handleSeedDemoData();
                  }}
                  activeOpacity={0.75}
                >
                  <Sparkles size={17} color={colors.primaryText} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{t('demoMode')}</Text>
                </TouchableOpacity>
              )}

              {isDevMode && (
                <TouchableOpacity
                  style={[styles.actionRow, { borderTopColor: colors.border }]}
                  onPress={() => {
                    closeSettings();
                    handleResetAllData();
                  }}
                  activeOpacity={0.75}
                >
                  <RotateCcw size={17} color={colors.errorText} />
                  <Text style={[styles.menuLabel, { color: colors.errorText }]}>{t('resetData')}</Text>
                </TouchableOpacity>
              )}
            </Card>
          </MotiView>
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
});
