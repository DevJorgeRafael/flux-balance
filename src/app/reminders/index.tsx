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
import { appAlert } from '@/components/ui/alert/appAlert';
import { Card } from '@/components/ui/Card';
import { useColors, useInsets } from '@/components/ui/theme';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { ReminderListRow } from '@/components/reminders/ReminderListRow';
import { ReminderScreenHeader } from '@/components/reminders/ReminderScreenHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Reminder } from '@/core/models/reminder';
import { SqliteReminderRepository } from '@/infrastructure/repositories';

const reminderRepo = new SqliteReminderRepository();

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      void loadReminders();
    }, [loadReminders])
  );

  const active = reminders?.filter((reminder) => !reminder.isArchived) ?? [];
  const archived = reminders?.filter((reminder) => reminder.isArchived) ?? [];

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
                  {active.map((reminder) => (
                    <ReminderListRow
                      key={reminder.id}
                      reminder={reminder}
                      onPress={() => openForm(reminder.id)}
                    />
                  ))}
                </View>
              ) : null}

              {archived.length > 0 ? (
                <View style={styles.group}>
                  <SectionLabel>{t('archivedReminders')}</SectionLabel>
                  {archived.map((reminder) => (
                    <ReminderListRow
                      key={reminder.id}
                      reminder={reminder}
                      onPress={() => openForm(reminder.id)}
                    />
                  ))}
                </View>
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
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  group: {
    marginBottom: 20,
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
