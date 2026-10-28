import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil } from 'lucide-react-native';
import type { Category } from '@/core/models/category';
import { isHexColor, useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

interface CategoryListRowProps {
  category: Category;
  onEdit: () => void;
}

export function CategoryListRow({ category, onEdit }: CategoryListRowProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Card style={styles.row}>
      <View
        style={[
          styles.colorDot,
          { backgroundColor: isHexColor(category.color) ? category.color : colors.chartOther },
        ]}
      />

      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {category.name}
      </Text>

      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`${t('edit')} ${category.name}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.editButton,
          { backgroundColor: colors.inputBackground },
          pressed && styles.pressed,
        ]}
      >
        <Pencil size={17} color={colors.text} strokeWidth={2.2} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
