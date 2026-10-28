import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import {
  fontSize,
  radius,
  spacing,
  useColors,
  useInsets,
} from '@/components/ui/theme';
import {
  countLicensePackages,
  filterLicenseGroups,
  isCombinedLicense,
  type LicenseGroup,
} from '@/core/services/license-search';
import { useTranslation } from '@/core/i18n/useTranslation';
import licensesData from '@/constants/thirdPartyLicenses.json';

const groups = (licensesData as { groups: LicenseGroup[] }).groups;
const totalPackages = countLicensePackages(groups);

type ListRow =
  | { type: 'group'; key: string; group: LicenseGroup }
  | {
      type: 'groupPackage';
      key: string;
      name: string;
      version: string;
      isLast: boolean;
    }
  | {
      type: 'searchPackage';
      key: string;
      name: string;
      version: string;
      license: string;
    };

function buildGroupedRows(groups: LicenseGroup[]): ListRow[] {
  const rows: ListRow[] = [];

  for (const group of groups) {
    rows.push({ type: 'group', key: `group:${group.license}`, group });

    group.packages.forEach((pkg, index) => {
      rows.push({
        type: 'groupPackage',
        key: `pkg:${group.license}:${pkg.name}@${pkg.version}`,
        name: pkg.name,
        version: pkg.version,
        isLast: index === group.packages.length - 1,
      });
    });
  }

  return rows;
}

function buildSearchRows(groups: LicenseGroup[]): ListRow[] {
  return groups.flatMap((group) =>
    group.packages.map((pkg) => ({
      type: 'searchPackage' as const,
      key: `search:${group.license}:${pkg.name}@${pkg.version}`,
      name: pkg.name,
      version: pkg.version,
      license: group.license,
    }))
  );
}

export function LicenseCatalog() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const appName = Constants.expoConfig?.name ?? 'Flux Balance';

  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => filterLicenseGroups(groups, query), [query]);
  const searching = query.trim().length > 0;

  const rows = useMemo(
    () => (searching ? buildSearchRows(filtered.groups) : buildGroupedRows(groups)),
    [searching, filtered.groups]
  );

  const toggleExpanded = (license: string) => {
    setExpanded((previous) => ({
      ...previous,
      [license]: !previous[license],
    }));
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.type === 'group') {
      const isExpanded = expanded[item.group.license] === true;
      const hasText = item.group.text.trim().length > 0;
      const combined = isCombinedLicense(item.group.license);

      return (
        <Card style={styles.groupCard} borderWidth={StyleSheet.hairlineWidth}>
          <View style={styles.groupHeader}>
            <Text
              style={[styles.licenseName, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.group.license}
            </Text>
            <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.countText, { color: colors.primaryText }]}>
                {item.group.packages.length}
              </Text>
            </View>
          </View>

          {hasText ? (
            <Pressable
              onPress={() => toggleExpanded(item.group.license)}
              style={({ pressed }) => [styles.textToggle, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.group.license}: ${
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
                {item.group.text}
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
    }

    if (item.type === 'groupPackage') {
      return (
        <View
          style={[
            styles.packageRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
            item.isLast && styles.packageRowLast,
          ]}
        >
          <Text style={[styles.packageName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.packageVersion, { color: colors.textLight }]}>
            v{item.version}
          </Text>
        </View>
      );
    }

    return (
      <Card style={styles.searchResultCard}>
        <Text style={[styles.packageName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.searchMeta, { color: colors.textLight }]} numberOfLines={2}>
          v{item.version} · {item.license}
        </Text>
      </Card>
    );
  };

  const listHeader = searching ? undefined : (
    <Card style={styles.noticeCard}>
      <Text style={[styles.notice, { color: colors.textLight }]}>
        {t('thirdPartyNotice', { app: appName })}
      </Text>
    </Card>
  );

  const emptyComponent = (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: colors.textLight }]}>
        {t('noPackagesFound')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Search size={18} color={colors.textLight} strokeWidth={2.4} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPackages')}
            placeholderTextColor={colors.textLight}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.primary}
            accessibilityLabel={t('searchPackages')}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('clearSearch')}
            >
              <X size={16} color={colors.textLight} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.summary, { color: colors.textLight }]}>
          {searching
            ? t('searchResults', { count: filtered.total })
            : t('licenseSummary', {
                packages: totalPackages,
                groups: groups.length,
              })}
        </Text>
      </View>

      <FlatList<ListRow>
        data={rows}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
          rows.length === 0 && styles.emptyContent,
        ]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
  },
  summary: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
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
  packageName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  packageVersion: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  searchResultCard: {
    padding: spacing.lg,
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  searchMeta: {
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
