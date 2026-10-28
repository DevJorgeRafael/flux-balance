import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { CategoryListRow } from '@/components/categories/CategoryListRow';
import { bestTextColor, useColors, useInsets } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import {
  CATEGORY_TYPE_ACCENTS,
  type CategoryPaletteType,
} from '@/core/constants/categoryPalettes';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Category } from '@/core/models/category';
import { parseCategoryType } from '@/core/services/category-management';
import { SqliteCategoryRepository } from '@/infrastructure/repositories';

const categoryRepo = new SqliteCategoryRepository();

export default function CategoryListScreen() {
  const rawParams = useLocalSearchParams<{ type?: string | string[] }>();
  const rawType = Array.isArray(rawParams.type) ? rawParams.type[0] : rawParams.type;
  const type = parseCategoryType(rawType);
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[] | null>(null);

  const loadCategories = useCallback(async () => {
    if (!type) return;

    try {
      const result = await categoryRepo.getAll(type);
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories((current) => current ?? []);
      Alert.alert(t('error'), t('errorLoadingCategories'));
    }
  }, [t, type]);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  const title = type === 'INCOME' ? t('incomeCategories') : t('expenseCategories');

  const handleCreate = () => {
    if (!type) return;
    router.push({ pathname: '/settings/category-form', params: { type } });
  };

  const handleEdit = (category: Category) => {
    if (!type) return;
    router.push({
      pathname: '/settings/category-form',
      params: { type, id: category.id },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
          {type ? title : t('categories')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {!type ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {t('invalidCategoryType')}
          </Text>
        </View>
      ) : categories === null ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CATEGORY_TYPE_ACCENTS[type]} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={[styles.emptyText, { color: colors.textLight }]}>
                  {t('noCategories')}
                </Text>
              </Card>
            ) : (
              categories.map((category) => (
                <CategoryListRow
                  key={category.id}
                  category={category}
                  onEdit={() => handleEdit(category)}
                />
              ))
            )}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + 16, backgroundColor: colors.background },
            ]}
          >
            <ActionButton
              type={type}
              label={t('newCategory')}
              onPress={handleCreate}
            />
          </View>
        </>
      )}
    </View>
  );
}

function ActionButton({
  type,
  label,
  onPress,
}: {
  type: CategoryPaletteType;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const accent = CATEGORY_TYPE_ACCENTS[type];
  const labelColor = bestTextColor(accent, colors.white, colors.black);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <Plus size={19} color={labelColor} strokeWidth={2.8} />
      <Text style={[styles.actionButtonText, { color: labelColor }]}>{label}</Text>
    </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyCard: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.72,
  },
});
