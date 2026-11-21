import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Reminder } from '@/core/models/reminder';
import { SqliteReminderRepository } from '@/infrastructure/repositories';

const reminderRepo = new SqliteReminderRepository();

export interface ReminderOverview {
  reminders: Reminder[];
  isLoading: boolean;
}

export function useReminderOverview(): ReminderOverview {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      reminderRepo
        .getAll()
        .then((items) => {
          if (!cancelled) setReminders(items);
        })
        .catch((error) => {
          console.error('Error loading reminder overview:', error);
          if (!cancelled) setReminders([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return { reminders, isLoading };
}
