import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell, Plus } from 'lucide-react-native';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { Card } from '@/components/ui/Card';
import { spacing, useColors, useInsets } from '@/components/ui/theme';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { ReminderListRow } from '@/components/reminders/ReminderListRow';
import { ReminderScreenHeader } from '@/components/reminders/ReminderScreenHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Reminder } from '@/core/models/reminder';
import {
  REMINDER_BATTERY_TIP_DISMISSED_KEY,
  isReminderBatteryTipVisible,
} from '@/core/services/reminder-battery-tip';
import { useReminderNotifications } from '@/context/ReminderNotificationsProvider';
import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import { SqliteReminderRepository } from '@/infrastructure/repositories';

const reminderRepo = new SqliteReminderRepository();

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const { refreshReminderNotifications } = useReminderNotifications();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [batteryTipDismissed, setBatteryTipDismissed] = useState<boolean | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      setReminders(await reminderRepo.getAll(true));
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders((current) => current ?? []);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('errorLoadingReminders'),
        buttons: [{ text: t('accept') }],
      });
    }
  }, [t]);

  const loadBatteryTipPreference = useCallback(async () => {
    try {
      setBatteryTipDismissed(
        (await getAppSetting(REMINDER_BATTERY_TIP_DISMISSED_KEY)) === '1'
      );
    } catch (error) {
      console.error('Error loading reminder battery tip:', error);
      setBatteryTipDismissed(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReminders();
      void loadBatteryTipPreference();
    }, [loadBatteryTipPreference, loadReminders])
  );

  const handleDismissBatteryTip = useCallback(async () => {
    setBatteryTipDismissed(true);
    try {
      await setAppSetting(REMINDER_BATTERY_TIP_DISMISSED_KEY, '1');
    } catch (error) {
      console.error('Error saving reminder battery tip:', error);
    }
  }, []);

  const handleDelete = useCallback(
    async (reminder: Reminder) => {
      if (deletingId) return;

      const confirmed = await appConfirm({
        title: t('deleteReminderTitle'),
        message: t('deleteReminderMessage', { title: reminder.title }),
        confirmText: t('delete'),
        cancelText: t('cancel'),
        destructive: true,
      });
      if (!confirmed) return;

      try {
        setDeletingId(reminder.id);
        await reminderRepo.delete(reminder.id);
        await refreshReminderNotifications(reminder.id);
        await loadReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('errorDeletingReminder'),
          buttons: [{ text: t('accept') }],
        });
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, loadReminders, refreshReminderNotifications, t]
  );

  const active = reminders?.filter((reminder) => !reminder.isArchived) ?? [];
  const archived = reminders?.filter((reminder) => reminder.isArchived) ?? [];
  const showBatteryTip =
    batteryTipDismissed !== null &&
    isReminderBatteryTipVisible(active.length, batteryTipDismissed);

  const openForm = (id?: string) => {
    if (id) {
      router.push({ pathname: '/reminders/form', params: { id } });
    } else {
      router.push('/reminders/form');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ReminderScreenHeader
        title={t('reminders')}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => openForm()}
            accessibilityRole="button"
            accessibilityLabel={t('newReminder')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Plus size={20} color={colors.onPrimary} strokeWidth={2.8} />
          </Pressable>
        }
      />

      {reminders === null ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {reminders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View
                style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}
              >
                <Bell size={24} color={colors.primaryText} strokeWidth={2.2} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('noReminders')}
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textLight }]}>
                {t('noRemindersHint')}
              </Text>
            </Card>
          ) : (
            <>
              {active.length > 0 ? (
                <View style={styles.group}>
                  <SectionLabel>{t('activeReminders')}</SectionLabel>
                  <View style={styles.rows}>
                    {active.map((reminder) => (
                      <ReminderListRow
                        key={reminder.id}
                        reminder={reminder}
                        onPress={() => openForm(reminder.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {archived.length > 0 ? (
                <View style={styles.group}>
                  <SectionLabel>{t('archivedReminders')}</SectionLabel>
                  <View style={styles.rows}>
                    {archived.map((reminder) => (
                      <ReminderListRow
                        key={reminder.id}
                        reminder={reminder}
                        onPress={() => openForm(reminder.id)}
                        onDelete={() => {
                          void handleDelete(reminder);
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {showBatteryTip ? (
                <Card style={styles.batteryTip}>
                  <Text style={[styles.batteryTipText, { color: colors.textLight }]}>
                    {t('reminderBatteryTipMessage')}
                  </Text>
                  <Button
                    title={t('understood')}
                    onPress={handleDismissBatteryTip}
                    variant="ghost"
                    size="sm"
                    style={styles.batteryTipButton}
                  />
                </Card>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  group: {
    marginBottom: spacing.lg,
  },
  rows: {
    gap: spacing.lg,
  },
  batteryTip: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  batteryTipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  batteryTipButton: {
    alignSelf: 'flex-start',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  pressed: {
    opacity: 0.72,
  },
});
