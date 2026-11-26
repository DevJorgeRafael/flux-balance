import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Trash from 'lucide-react-native/icons/trash';
import { appConfirm } from '@/components/ui/alert/appAlert';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { HelpButton } from '@/components/ui/HelpButton';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { spacing, useColors, useInsets } from '@/components/ui/theme';
import { useDashboard } from '@/context/DashboardContext';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { CategoryRule } from '@/core/services/category-rules';
import { SqliteCategoryRuleRepository } from '@/infrastructure/repositories';

const repository = new SqliteCategoryRuleRepository();

export default function CategoryRulesScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const { categories } = useDashboard();
  const [rules, setRules] = useState<CategoryRule[]>([]);

  const reload = useCallback(() => {
    repository
      .getAll()
      .then(setRules)
      .catch((error) => console.error('Error cargando reglas:', error));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleDelete = async (rule: CategoryRule) => {
    const confirmed = await appConfirm({
      title: t('deleteRule'),
      message: rule.keyword,
      confirmText: t('delete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    await repository.delete(rule.id);
    reload();
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />}
          accessibilityLabel={t('goBack')}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('categoryRules')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introRow}>
          <Text style={[styles.intro, { color: colors.textLight }]}>
            {t('categoryRulesIntro')}
          </Text>
          <HelpButton
            title={t('helpLocalBrainTitle')}
            message={t('helpLocalBrainMessage')}
          />
        </View>

        <SectionLabel>{t('categoryRules')}</SectionLabel>
        <Card style={styles.card}>
          {rules.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>
              {t('noRules')}
            </Text>
          ) : (
            rules.map((rule, index) => (
              <View
                key={rule.id}
                style={[
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View style={styles.rowInfo}>
                  <Text style={[styles.keyword, { color: colors.text }]}>
                    {rule.keyword}
                  </Text>
                  <Text style={[styles.detail, { color: colors.textLight }]}>
                    {categories.find((category) => category.id === rule.categoryId)?.name ??
                      rule.categoryId}{'  ·  '}
                    {t('ruleUses', { count: rule.hits })}
                  </Text>
                </View>
                <IconButton
                  icon={<Trash size={18} color={colors.errorText} strokeWidth={2.2} />}
                  accessibilityLabel={t('deleteRule')}
                  onPress={() => handleDelete(rule)}
                />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: 13, flex: 1 },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  card: { paddingHorizontal: spacing.md },
  empty: { fontSize: 13, paddingVertical: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  rowInfo: { flex: 1 },
  keyword: { fontSize: 14, fontWeight: '700' },
  detail: { fontSize: 12 },
});
