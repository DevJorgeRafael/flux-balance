import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Trash } from 'lucide-react-native';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { CategoryColorGrid } from '@/components/categories/CategoryColorGrid';
import { bestTextColor, useColors, useInsets } from '@/components/ui/theme';
import {
  CATEGORY_TYPE_ACCENTS,
  pickUnusedPaletteColor,
} from '@/core/constants/categoryPalettes';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Category } from '@/core/models/category';
import {
  normalizeCategoryName,
  parseCategoryType,
  type CategoryNameError,
  validateCategoryName,
} from '@/core/services/category-management';
import { SqliteCategoryRepository } from '@/infrastructure/repositories';

const categoryRepo = new SqliteCategoryRepository();

export default function CategoryFormScreen() {
  const rawParams = useLocalSearchParams<{
    type?: string | string[];
    id?: string | string[];
  }>();
  const rawType = Array.isArray(rawParams.type) ? rawParams.type[0] : rawParams.type;
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const type = parseCategoryType(rawType);

  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!type) return;

    const load = async () => {
      try {
        const result = await categoryRepo.getAll(type);
        if (isCancelled) return;

        setCategories(result);

        if (id) {
          const current = result.find((item) => item.id === id);
          if (!current) {
            setNotFound(true);
            return;
          }

          const fallbackColor = pickUnusedPaletteColor(
            type,
            new Set(
              result
                .map((item) => item.color?.toLowerCase())
                .filter((color): color is string => Boolean(color))
            )
          );
          setCategory(current);
          setName(current.name);
          setSelectedColor(current.color ?? fallbackColor);
          return;
        }

        setSelectedColor(
          pickUnusedPaletteColor(
            type,
            new Set(
              result
                .map((item) => item.color?.toLowerCase())
                .filter((color): color is string => Boolean(color))
            )
          )
        );
      } catch (error) {
        console.error('Error loading category form:', error);
        if (!isCancelled) {
          setNotFound(true);
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [id, type]);

  const validationError = useMemo<CategoryNameError | null>(() => {
    if (!type) return null;
    return validateCategoryName(name, categories, type, id);
  }, [categories, id, name, type]);

  const nameErrorText =
    validationError === 'required'
      ? t('categoryNameRequired')
      : validationError === 'duplicate'
        ? t('categoryNameDuplicate')
        : null;

  const setDuplicateError = () => {
    setShowNameError(true);
  };

  const handleSave = async () => {
    if (!type) return;

    const normalizedName = normalizeCategoryName(name);
    setName(normalizedName);
    setShowNameError(true);

    if (validateCategoryName(normalizedName, categories, type, id)) {
      return;
    }

    try {
      setIsSaving(true);

      if (category) {
        await categoryRepo.update(
          category.id,
          { name: normalizedName, color: selectedColor },
          type
        );
      } else {
        await categoryRepo.create({
          name: normalizedName,
          type,
          color: selectedColor,
        });
      }

      router.back();
    } catch (error) {
      console.error('Error saving category:', error);
      if (error instanceof Error && error.message === 'CATEGORY_NAME_DUPLICATE') {
        setDuplicateError();
      } else {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('errorSavingCategory'),
          buttons: [{ text: t('accept') }],
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !type) return;

    try {
      setIsDeleting(true);
      const usageCount = await categoryRepo.getUsageCount(category.id, type);
      const messageKey = usageCount === 1 ? 'deleteCategoryMessageOne' : 'deleteCategoryMessageOther';

      const confirmed = await appConfirm({
        title: t('deleteCategoryTitle'),
        message: t(messageKey, { count: usageCount }),
        confirmText: t('delete'),
        cancelText: t('cancel'),
        destructive: true,
      });

      if (!confirmed) {
        setIsDeleting(false);
        return;
      }

      try {
        await categoryRepo.delete(category.id, type);
        router.back();
      } catch (error) {
        console.error('Error deleting category:', error);
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('errorDeletingCategory'),
          buttons: [{ text: t('accept') }],
        });
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error counting category movements:', error);
      setIsDeleting(false);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('errorDeletingCategory'),
        buttons: [{ text: t('accept') }],
      });
    }
  };

  const title = category ? t('editCategory') : t('newCategory');
  const accent = type ? CATEGORY_TYPE_ACCENTS[type] : colors.primary;
  const accentText = bestTextColor(accent, colors.white, colors.black);

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
          {!type ? t('categories') : title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {!type || notFound ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {!type ? t('invalidCategoryType') : t('categoryNotFound')}
          </Text>
        </View>
      ) : !isReady ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 32 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={[styles.label, { color: colors.textLight }]}>
              {t('categoryName')}
            </Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (showNameError) setShowNameError(false);
              }}
              onBlur={() => {
                setName((current) => normalizeCategoryName(current));
                setShowNameError(true);
              }}
              placeholder={t('categoryNamePlaceholder')}
              placeholderTextColor={colors.textLight}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="done"
            />
            {showNameError && nameErrorText ? (
              <Text style={[styles.errorText, { color: colors.errorText }]}>
                {nameErrorText}
              </Text>
            ) : null}

            <Text style={[styles.label, styles.colorLabel, { color: colors.textLight }]}>
              {t('selectColor')}
            </Text>
            <CategoryColorGrid
              type={type}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            {category?.isDefault ? (
              <Text style={[styles.defaultHint, { color: colors.textLight }]}>
                {t('defaultCategoryHint')}
              </Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={category ? t('saveChanges') : t('createCategory')}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accent, opacity: isSaving ? 0.72 : pressed ? 0.85 : 1 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={accentText} />
              ) : (
                <>
                  <Check size={19} color={accentText} strokeWidth={2.8} />
                  <Text style={[styles.primaryButtonText, { color: accentText }]}>
                    {category ? t('saveChanges') : t('createCategory')}
                  </Text>
                </>
              )}
            </Pressable>

            {category && !category.isDefault ? (
              <Pressable
                onPress={() => void handleDelete()}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel={t('deleteCategory')}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: colors.errorSoft, opacity: isDeleting ? 0.6 : pressed ? 0.75 : 1 },
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.errorText} />
                ) : (
                  <>
                    <Trash size={18} color={colors.errorText} strokeWidth={2.4} />
                    <Text style={[styles.deleteButtonText, { color: colors.errorText }]}>
                      {t('deleteCategory')}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
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
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  colorLabel: {
    marginTop: 24,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  defaultHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
