import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useAnticipation } from '@/hooks/useAnticipation';
import {
  getAppSetting,
  setAppSetting,
} from '@/infrastructure/database/appSettings';

const NOTIFIED_KEY = 'anticipationLastNotified';
const TAP_DATA_KEY = 'kind';
const TAP_DATA_VALUE = 'anticipation';

export function AnticipationNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { events, isLoading } = useAnticipation();
  const { t } = useTranslation();
  const notifiedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (cancelled || !response) return;
        if (response.notification.request.content.data?.[TAP_DATA_KEY] === TAP_DATA_VALUE) {
          router.push('/settings/budgets');
        }
      })
      .catch((error) => {
        console.error('Error reading anticipation notification tap:', error);
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (response.notification.request.content.data?.[TAP_DATA_KEY] === TAP_DATA_VALUE) {
          router.push('/settings/budgets');
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading || events.length === 0 || notifiedRef.current) return;

    let cancelled = false;
    notifiedRef.current = true;

    const notify = async () => {
      try {
        const permissions = await Notifications.getPermissionsAsync();
        if (permissions.status !== 'granted') return;

        const today = new Date().toISOString().slice(0, 10);
        const last = await getAppSetting(NOTIFIED_KEY);
        if (last === today) return;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('anticipationNotificationTitle'),
            body: t('anticipationNotificationBody'),
            data: { [TAP_DATA_KEY]: TAP_DATA_VALUE },
          },
          trigger: null,
        });

        if (!cancelled) await setAppSetting(NOTIFIED_KEY, today);
      } catch (error) {
        console.error('Error sending anticipation notification:', error);
        notifiedRef.current = false;
      }
    };

    void notify();
    return () => {
      cancelled = true;
    };
  }, [events.length, isLoading, t]);

  return <>{children}</>;
}
