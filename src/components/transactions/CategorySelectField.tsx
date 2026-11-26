import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Plus from 'lucide-react-native/icons/plus';
import { SelectField } from '@/components/ui/SelectField';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { CategoryType } from '@/core/models/category';
import { useCategoryCreationStore } from '@/store/categoryCreationStore';
import { useDashboardStore } from '@/store/dashboardStore';

type CategorySelectFieldProps = Omit<
  ComponentProps<typeof SelectField>,
  'footer'
> & {
  type: CategoryType;
};

export function CategorySelectField({
  type,
  ...props
}: CategorySelectFieldProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const requestCategory = useCategoryCreationStore(
    (state) => state.requestCategory
  );
  const pickerReopenToken = useCategoryCreationStore(
    (state) => state.pickerReopenToken
  );

  const handleCreate = (close: () => void) => {
    requestCategory(type);
    close();
    useDashboardStore.getState().hideTransactionModalForCategory(type);
  };

  return (
    <SelectField
      {...props}
      openSignal={pickerReopenToken}
      footer={(close) => (
        <Pressable
          onPress={() => handleCreate(close)}
          accessibilityRole="button"
          accessibilityLabel={t('newCategory')}
          style={({ pressed }) => [
            styles.footerRow,
            { borderTopColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Plus size={18} color={colors.primaryText} strokeWidth={2.4} />
          <Text style={[styles.footerText, { color: colors.primaryText }]}>
            {t('newCategory')}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  footerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
