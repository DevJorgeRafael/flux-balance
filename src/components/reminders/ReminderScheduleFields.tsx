import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CalendarDays, Clock3, X } from 'lucide-react-native';
import { Button } from '@/components/ui/atoms/Button';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { DatePicker } from '@/components/ui/organisms/DatePicker';
import { TimePicker } from '@/components/ui/organisms/TimePicker';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  localDateFromReminderDate,
  reminderDateFromLocalDate,
  reminderTimeFromTimeValue,
  timeValueFromReminderTime,
  type ReminderTimeValue,
} from '@/core/services/reminder-schedule';

interface ReminderScheduleFieldsProps {
  startDate: string;
  time: string;
  onChange: (key: 'startDate' | 'time', value: string) => void;
}

type PickerKind = 'date' | 'time';

const DEFAULT_TIME: ReminderTimeValue = { hour: 9, minute: 0 };

export function ReminderScheduleFields({
  startDate,
  time,
  onChange,
}: ReminderScheduleFieldsProps) {
  const colors = useColors();
  const { language, t } = useTranslation();
  const [activePicker, setActivePicker] = useState<PickerKind>('date');
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(
    () => localDateFromReminderDate(startDate) ?? new Date()
  );
  const [draftTime, setDraftTime] = useState<ReminderTimeValue>(
    () => timeValueFromReminderTime(time) ?? DEFAULT_TIME
  );

  const openDatePicker = () => {
    Keyboard.dismiss();
    setDraftDate(localDateFromReminderDate(startDate) ?? new Date());
    setActivePicker('date');
    setIsOpen(true);
  };

  const openTimePicker = () => {
    Keyboard.dismiss();
    setDraftTime(timeValueFromReminderTime(time) ?? DEFAULT_TIME);
    setActivePicker('time');
    setIsOpen(true);
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  const confirmPicker = () => {
    if (activePicker === 'date') {
      onChange('startDate', reminderDateFromLocalDate(draftDate));
    } else {
      onChange('time', reminderTimeFromTimeValue(draftTime));
    }
    setIsOpen(false);
  };

  const isDatePicker = activePicker === 'date';
  const dateText = startDate || t('datePlaceholder');
  const timeText = time || t('timePlaceholder');
  const firstDayOfWeek = language === 'es' ? 1 : 0;

  return (
    <>
      <View style={styles.dateTimeRow}>
        <View style={styles.flex}>
          <Text style={[styles.label, { color: colors.textLight }]}>
            {t('startDate')}
          </Text>
          <Pressable
            onPress={openDatePicker}
            accessibilityRole="button"
            accessibilityLabel={`${t('startDate')}: ${dateText}`}
            accessibilityHint={t('selectDate')}
            accessibilityState={{ expanded: isOpen && activePicker === 'date' }}
            style={({ pressed }) => [
              styles.fieldRow,
              { backgroundColor: colors.inputBackground },
              pressed && styles.pressed,
            ]}
          >
            <CalendarDays size={18} color={colors.textLight} strokeWidth={2.2} />
            <Text
              numberOfLines={1}
              style={[
                styles.fieldText,
                { color: startDate ? colors.text : colors.textLight },
              ]}
            >
              {dateText}
            </Text>
          </Pressable>
        </View>

        <View style={styles.flex}>
          <Text style={[styles.label, { color: colors.textLight }]}>
            {t('startTime')}
          </Text>
          <Pressable
            onPress={openTimePicker}
            accessibilityRole="button"
            accessibilityLabel={`${t('startTime')}: ${timeText}`}
            accessibilityHint={t('selectTime')}
            accessibilityState={{ expanded: isOpen && activePicker === 'time' }}
            style={({ pressed }) => [
              styles.fieldRow,
              { backgroundColor: colors.inputBackground },
              pressed && styles.pressed,
            ]}
          >
            <Clock3 size={18} color={colors.textLight} strokeWidth={2.2} />
            <Text
              numberOfLines={1}
              style={[
                styles.fieldText,
                { color: time ? colors.text : colors.textLight },
              ]}
            >
              {timeText}
            </Text>
          </Pressable>
        </View>
      </View>

      <BottomSheetModal
        visible={isOpen}
        onClose={closeSheet}
        maxHeight="90%"
        bottomPaddingExtra={16}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {isDatePicker ? t('selectDate') : t('selectTime')}
          </Text>
          <Pressable
            onPress={closeSheet}
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
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
        >
          {isDatePicker ? (
            <DatePicker
              value={draftDate}
              onChange={setDraftDate}
              firstDayOfWeek={firstDayOfWeek}
            />
          ) : (
            <TimePicker
              value={draftTime}
              onChange={setDraftTime}
              hourFormat="24h"
              minuteStep={1}
              visibleCount={3}
            />
          )}
        </ScrollView>

        <Button
          title={t('done')}
          onPress={confirmPicker}
          style={styles.confirmButton}
        />
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldRow: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.72,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sheetScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetContent: {
    paddingVertical: 8,
  },
  confirmButton: {
    marginTop: 16,
  },
});
