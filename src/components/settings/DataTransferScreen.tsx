import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import {
  fontSize,
  lineHeight,
  radius,
  spacing,
  useColors,
  useInsets,
} from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

export interface DataTransferOption {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  format: string;
  onPress: () => void;
}

interface DataTransferScreenProps {
  title: string;
  intro: string;
  warning?: string;
  options: readonly DataTransferOption[];
  busy: boolean;
  children?: React.ReactNode;
}

export function DataTransferScreen({
  title,
  intro,
  warning,
  options,
  busy,
  children,
}: DataTransferScreenProps) {
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
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.introCard}>
          <Text style={[styles.introText, { color: colors.textLight }]}>
            {intro}
          </Text>
        </Card>

        {warning ? (
          <Card
            variant="flat"
            backgroundColor={colors.warningSoft}
            style={styles.warningCard}
          >
            <TriangleAlert
              size={18}
              color={colors.warningText}
              strokeWidth={2.2}
            />
            <Text style={[styles.warningText, { color: colors.warningText }]}>
              {warning}
            </Text>
          </Card>
        ) : null}

        {options.map((option) => {
          const Icon = option.icon;

          return (
            <Pressable
              key={option.key}
              onPress={option.onPress}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`${option.title}, ${option.format}. ${option.description}`}
              accessibilityState={{ disabled: busy }}
              style={({ pressed }) => [
                styles.optionPressable,
                busy && styles.optionDisabled,
                pressed && !busy && styles.pressed,
              ]}
            >
              <Card style={styles.optionCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Icon
                    size={20}
                    color={colors.primaryText}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.texts}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <View
                      style={[
                        styles.formatPill,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.formatText,
                          { color: colors.primaryText },
                        ]}
                      >
                        {option.format}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textLight },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>

                <ChevronRight
                  size={17}
                  color={colors.textLight}
                  strokeWidth={2.4}
                />
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      {children}
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
    paddingBottom: spacing.md,
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
  content: {
    paddingHorizontal: spacing.xxl,
  },
  introCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  introText: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    lineHeight: lineHeight.md,
  },
  optionPressable: {
    marginBottom: spacing.md,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionTitle: {
    flexShrink: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  formatPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  formatText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: lineHeight.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
