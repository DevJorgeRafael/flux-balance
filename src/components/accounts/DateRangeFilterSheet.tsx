import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import X from 'lucide-react-native/icons/x';
import { Button } from '@/components/ui/atoms/Button';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { DatePicker, type DateRange } from '@/components/ui/organisms/DatePicker';
import { spacing, useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

interface DateRangeFilterSheetProps {
  visible: boolean;
  range: DateRange | null;
  onClose: () => void;
  onApply: (range: DateRange | null) => void;
}

export function DateRangeFilterSheet({
  visible,
  range,
  onClose,
  onApply,
}: DateRangeFilterSheetProps) {
  const colors = useColors();
  const { t, language } = useTranslation();
  const [draft, setDraft] = useState<DateRange | null>(range);
  const today = useMemo(() => new Date(), []);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeight="90%"
      bottomPaddingExtra={16}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('dateRangeTitle')}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={22} color={colors.textLight} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.hint, { color: colors.textLight }]}>{t('dateRangeHint')}</Text>
        <DatePicker
          mode="range"
          range={draft ?? undefined}
          onRangeChange={setDraft}
          maxDate={today}
          firstDayOfWeek={language === 'es' ? 1 : 0}
        />
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title={t('clearDateFilter')}
          variant="ghost"
          onPress={() => onApply(null)}
          style={styles.clearButton}
        />
        <Button
          title={t('applyDateFilter')}
          onPress={() => onApply(draft)}
          style={styles.applyButton}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  hint: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});
