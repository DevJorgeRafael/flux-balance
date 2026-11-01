import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { Search, X } from 'lucide-react-native';
import { fontSize, radius, spacing, useColors, useInsets } from '@/components/ui/theme';
import {
  filterLicenseGroups,
  type LicenseCatalogData,
} from '@/core/services/license-search';
import { useTranslation } from '@/core/i18n/useTranslation';
import { LicenseGroupList } from './LicenseGroupList';
import { LicenseSearchList } from './LicenseSearchList';

export function LicenseCatalog() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const appName = Constants.expoConfig?.name ?? 'Flux Balance';

  const [catalog, setCatalog] = useState<LicenseCatalogData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length > 0;
  const isFiltering = query !== deferredQuery;

  useEffect(() => {
    let active = true;

    const load = () => {
      void import('@/constants/thirdPartyLicenses.json')
        .then((module) => {
          if (active) setCatalog(module.default as LicenseCatalogData);
        })
        .catch(() => {
          if (active) setLoadFailed(true);
        });
    };

    const handle = requestIdleCallback(load, { timeout: 800 });

    return () => {
      active = false;
      cancelIdleCallback(handle);
    };
  }, []);

  const filtered = useMemo(
    () =>
      catalog && deferredQuery.trim()
        ? filterLicenseGroups(catalog.groups, deferredQuery)
        : null,
    [catalog, deferredQuery]
  );

  if (loadFailed) {
    return (
      <View style={styles.centeredState}>
        <Text style={[styles.stateText, { color: colors.textLight }]}>
          {t('licenseLoadError')}
        </Text>
      </View>
    );
  }

  if (!catalog) {
    return (
      <View
        style={styles.centeredState}
        accessibilityRole="progressbar"
        accessibilityLabel={t('loadingLicenses')}
      >
        <ActivityIndicator size="small" color={colors.primaryText} />
        <Text style={[styles.stateText, { color: colors.textLight }]}>
          {t('loadingLicenses')}
        </Text>
      </View>
    );
  }

  const summary = searching
    ? t('searchResults', { count: filtered?.total ?? 0 })
    : t('licenseSummary', {
        packages: catalog.summary.packages,
        groups: catalog.summary.groups,
      });

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

        <View style={styles.summaryRow}>
          <Text style={[styles.summary, { color: colors.textLight }]}>{summary}</Text>
          {isFiltering ? (
            <ActivityIndicator size="small" color={colors.textLight} />
          ) : null}
        </View>
      </View>

      {searching ? (
        <LicenseSearchList
          groups={filtered?.groups ?? []}
          bottomInset={insets.bottom}
        />
      ) : (
        <LicenseGroupList
          groups={catalog.groups}
          appName={appName}
          bottomInset={insets.bottom}
        />
      )}
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
  summaryRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summary: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  stateText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
