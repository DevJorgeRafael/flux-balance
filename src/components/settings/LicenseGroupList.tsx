import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { fontSize, radius, spacing, useColors } from '@/components/ui/theme';
import {
  isCombinedLicense,
  type LicenseGroup,
  type LicensePackage,
} from '@/core/services/license-search';
import type { TranslationKey } from '@/core/i18n/translations';
import { useTranslation } from '@/core/i18n/useTranslation';

interface LicenseSection extends LicenseGroup {
  data: LicensePackage[];
}

interface LicenseGroupListProps {
  groups: LicenseGroup[];
  appName: string;
  bottomInset: number;
}

export function LicenseGroupList({
  groups,
  appName,
  bottomInset,
}: LicenseGroupListProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sections = useMemo(
    () => groups.map((group) => ({ ...group, data: group.packages })),
    [groups]
  );

  const toggleExpanded = (license: string) => {
    setExpanded((previous) => ({
      ...previous,
      [license]: !previous[license],
    }));
  };

  return (
    <SectionList<LicensePackage, LicenseSection>
      sections={sections}
      keyExtractor={(item, index) => `${item.name}@${item.version}:${index}`}
      renderSectionHeader={({ section }) => {
        const isExpanded = expanded[section.license] === true;
        const hasText = section.text.trim().length > 0;
        const combined = isCombinedLicense(section.license);

        return (
          <Card style={styles.groupCard} borderWidth={StyleSheet.hairlineWidth}>
            <View style={styles.groupHeader}>
              <Text
                style={[styles.licenseName, { color: colors.text }]}
                numberOfLines={2}
              >
                {section.license}
              </Text>
              <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.countText, { color: colors.primaryText }]}>
                  {section.data.length}
                </Text>
              </View>
            </View>

            {hasText ? (
              <Pressable
                onPress={() => toggleExpanded(section.license)}
                style={({ pressed }) => [styles.textToggle, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${section.license}: ${
                  isExpanded ? t('hideLicenseText') : t('viewLicenseText')
                }`}
                accessibilityState={{ expanded: isExpanded }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.textToggleLabel, { color: colors.primaryText }]}>
                  {isExpanded ? t('hideLicenseText') : t('viewLicenseText')}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={16} color={colors.primaryText} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={16} color={colors.primaryText} strokeWidth={2.5} />
                )}
              </Pressable>
            ) : null}

            {isExpanded && hasText ? (
              <View
                style={[
                  styles.licenseTextBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text selectable style={[styles.licenseText, { color: colors.textLight }]}>
                  {section.text}
                </Text>
              </View>
            ) : null}

            {!hasText ? (
              <Text style={[styles.groupNote, { color: colors.textLight }]}>
                {combined ? t('combinedLicenseNote') : t('licenseTextUnavailable')}
              </Text>
            ) : null}
          </Card>
        );
      }}
      renderItem={({ item, index, section }) => (
        <View
          style={[
            styles.packageRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
            index === section.data.length - 1 && styles.packageRowLast,
          ]}
        >
          <View style={styles.packageInfo}>
            <Text style={[styles.packageName, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            {item.noticeKey ? (
              <Text style={[styles.packageNotice, { color: colors.textLight }]}>
                {t(item.noticeKey as TranslationKey)}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.packageVersion, { color: colors.textLight }]}>
            v{item.version}
          </Text>
        </View>
      )}
      ListHeaderComponent={
        <Card style={styles.noticeCard}>
          <Text style={[styles.notice, { color: colors.textLight }]}>
            {t('thirdPartyNotice', { app: appName })}
          </Text>
        </Card>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {t('noPackagesFound')}
          </Text>
        </View>
      }
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + spacing.xxl },
        sections.length === 0 && styles.emptyContent,
      ]}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
  },
  noticeCard: {
    padding: spacing.lg,
  },
  notice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  groupCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  licenseName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '800',
    lineHeight: 20,
  },
  countPill: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  textToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  textToggleLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  licenseTextBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  licenseText: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    lineHeight: 18,
  },
  groupNote: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  packageRowLast: {
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  packageNotice: {
    marginTop: spacing.xxs,
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: 16,
  },
  packageVersion: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
