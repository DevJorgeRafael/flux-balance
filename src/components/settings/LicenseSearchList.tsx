import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { fontSize, spacing, useColors } from '@/components/ui/theme';
import type { LicenseGroup } from '@/core/services/license-search';
import type { TranslationKey } from '@/core/i18n/translations';
import { useTranslation } from '@/core/i18n/useTranslation';

interface SearchRow {
  key: string;
  name: string;
  version: string;
  license: string;
  noticeKey?: string;
}

interface LicenseSearchListProps {
  groups: LicenseGroup[];
  bottomInset: number;
}

export function LicenseSearchList({ groups, bottomInset }: LicenseSearchListProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const rows = useMemo<SearchRow[]>(
    () =>
      groups.flatMap((group) =>
        group.packages.map((pkg) => ({
          key: `${group.license}:${pkg.name}@${pkg.version}`,
          name: pkg.name,
          version: pkg.version,
          license: group.license,
          noticeKey: pkg.noticeKey,
        }))
      ),
    [groups]
  );

  return (
    <FlatList<SearchRow>
      data={rows}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <Card style={styles.searchResultCard}>
          <Text style={[styles.packageName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.searchMeta, { color: colors.textLight }]} numberOfLines={2}>
            v{item.version} · {item.license}
          </Text>
          {item.noticeKey ? (
            <Text style={[styles.packageNotice, { color: colors.textLight }]}>
              {t(item.noticeKey as TranslationKey)}
            </Text>
          ) : null}
        </Card>
      )}
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
        rows.length === 0 && styles.emptyContent,
      ]}
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
  searchResultCard: {
    padding: spacing.lg,
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  packageName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  searchMeta: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  packageNotice: {
    marginTop: spacing.xxs,
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: 16,
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
});
