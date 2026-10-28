import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LicenseCatalog } from '@/components/settings/LicenseCatalog';
import {
  radius,
  spacing,
  useColors,
  useInsets,
} from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function ThirdPartyLicensesScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.topHeader}>
        <Pressable
          style={({ pressed }) => [
            styles.roundIconButton,
            { backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('thirdPartyLicenses')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <LicenseCatalog />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: 14,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginHorizontal: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  pressed: {
    opacity: 0.7,
  },
});
