import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AppState, Platform } from 'react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import type { Reminder } from '@/core/models/reminder';
import type {
  ReminderNotificationPermission,
  ReminderNotificationTap,
} from '@/core/notifications/IReminderNotificationGateway';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  IOS_REMINDER_NOTIFICATION_LIMIT,
  REMINDER_NOTIFICATION_WINDOW,
} from '@/core/services/reminder-notification-plan';
import { syncReminderNotifications } from '@/core/services/reminder-notification-sync';
import { SqliteReminderRepository } from '@/infrastructure/repositories';
import { ExpoReminderNotificationGateway } from '@/infrastructure/notifications/ExpoReminderNotificationGateway';
import { useDashboard } from './DashboardContext';

interface RefreshReminderOptions {
  requestPermission?: boolean;
}

interface ReminderNotificationsContextValue {
  refreshReminderNotifications: (
    reminderId?: string,
    options?: RefreshReminderOptions
  ) => Promise<ReminderNotificationPermission>;
}

const ReminderNotificationsContext =
  createContext<ReminderNotificationsContextValue | null>(null);

const reminderRepo = new SqliteReminderRepository();
const gateway = new ExpoReminderNotificationGateway();

export function ReminderNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { isLoading, openTransactionModal } = useDashboard();
  const isLoadingRef = useRef(isLoading);
  const bootstrappedRef = useRef(false);
  const pendingTapRef = useRef<ReminderNotificationTap | null>(null);
  const handledTapsRef = useRef(new Set<string>());
  const syncChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const contentFor = useCallback(
    (reminder: Reminder) => ({
      title: reminder.title,
      body: t(
        reminder.type === 'INCOME'
          ? 'reminderNotificationIncomeBody'
          : 'reminderNotificationExpenseBody'
      ),
    }),
    [t]
  );

  const cancelAllScheduled = useCallback(async () => {
    const identifiers = await gateway.getScheduledReminderIdentifiers();
    for (const identifier of identifiers) {
      await gateway.cancel(identifier);
    }
  }, []);

  const performRefresh = useCallback(
    async (
      reminderId?: string,
      options: RefreshReminderOptions = {}
    ): Promise<ReminderNotificationPermission> => {
      let permission: ReminderNotificationPermission = 'undetermined';

      try {
        await gateway.ensureChannel(t('reminderChannelName'));
        permission = await gateway.getPermissionStatus();
        if (permission === 'undetermined' && options.requestPermission) {
          permission = await gateway.requestPermission();
        }

        if (permission !== 'granted') {
          await cancelAllScheduled();
          return permission;
        }

        const reminders = await reminderRepo.getAll();
        await syncReminderNotifications({
          gateway,
          reminders,
          now: new Date(),
          contentFor,
          windowSize: REMINDER_NOTIFICATION_WINDOW,
          maxScheduled:
            Platform.OS === 'ios'
              ? IOS_REMINDER_NOTIFICATION_LIMIT
              : Number.POSITIVE_INFINITY,
          forceReminderIds: reminderId ? [reminderId] : [],
        });
      } catch (error) {
        console.error('Error syncing reminder notifications:', error);
      }

      return permission;
    },
    [cancelAllScheduled, contentFor, t]
  );

  const enqueueSync = useCallback(
    <T,>(task: () => Promise<T>): Promise<T> => {
      const result = syncChainRef.current.then(task, task);
      syncChainRef.current = result.then(
        () => undefined,
        () => undefined
      );
      return result;
    },
    []
  );

  const refreshReminderNotifications = useCallback(
    (reminderId?: string, options?: RefreshReminderOptions) =>
      enqueueSync(() => performRefresh(reminderId, options)),
    [enqueueSync, performRefresh]
  );

  const reconcileAndSync = useCallback(async () => {
    try {
      const reminders = await reminderRepo.getAll();
      const now = new Date();
      for (const reminder of reminders) {
        await reminderRepo.reconcileNextRunAt(reminder.id, now);
      }
    } catch (error) {
      console.error('Error reconciling reminders:', error);
    }

    await performRefresh();
  }, [performRefresh]);

  const scheduleReconcileAndSync = useCallback(
    () => enqueueSync(reconcileAndSync),
    [enqueueSync, reconcileAndSync]
  );

  const handleTap = useCallback(
    async (tap: ReminderNotificationTap) => {
      if (handledTapsRef.current.has(tap.identifier)) return;
      handledTapsRef.current.add(tap.identifier);

      const reminder = await reminderRepo.getById(tap.reminderId);
      gateway.clearInitialTap();

      if (!reminder || reminder.isArchived) {
        void appAlert({
          type: 'warning',
          title: t('reminderMissingTitle'),
          message: t('reminderMissingMessage'),
          buttons: [{ text: t('accept') }],
        });
        return;
      }

      try {
        await reminderRepo.recordNotificationSent(
          tap.reminderId,
          tap.scheduledFor
        );
        await reminderRepo.reconcileNextRunAt(tap.reminderId, new Date());
      } catch (error) {
        console.error('Error recording reminder notification:', error);
      }

      openTransactionModal(reminder.type, {
        amount: reminder.amount ?? undefined,
        description: reminder.description ?? reminder.title,
        accountId: reminder.accountId ?? undefined,
        categoryId: reminder.categoryId ?? undefined,
      });
    },
    [openTransactionModal, t]
  );

  useEffect(
    () =>
      gateway.addTapListener((tap) => {
        if (isLoadingRef.current) {
          pendingTapRef.current = tap;
          return;
        }
        void handleTap(tap).then(scheduleReconcileAndSync);
      }),
    [handleTap, scheduleReconcileAndSync]
  );

  useEffect(() => {
    if (isLoading || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const initialTap = gateway.getInitialTap();
    if (initialTap) pendingTapRef.current = initialTap;

    void (async () => {
      const tap = pendingTapRef.current;
      pendingTapRef.current = null;
      if (tap) await handleTap(tap);
      await scheduleReconcileAndSync();
    })();
  }, [handleTap, isLoading, scheduleReconcileAndSync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void scheduleReconcileAndSync();
    });
    return () => subscription.remove();
  }, [scheduleReconcileAndSync]);

  const value = useMemo<ReminderNotificationsContextValue>(
    () => ({ refreshReminderNotifications }),
    [refreshReminderNotifications]
  );

  return (
    <ReminderNotificationsContext.Provider value={value}>
      {children}
    </ReminderNotificationsContext.Provider>
  );
}

export function useReminderNotifications(): ReminderNotificationsContextValue {
  const context = useContext(ReminderNotificationsContext);
  if (!context) {
    throw new Error(
      'useReminderNotifications must be used within a ReminderNotificationsProvider.'
    );
  }
  return context;
}
