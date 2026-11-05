import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type {
  IReminderNotificationGateway,
  ReminderNotificationPermission,
  ReminderNotificationRequest,
  ReminderNotificationTap,
} from '@/core/notifications/IReminderNotificationGateway';
import { isReminderNotificationId } from '@/core/services/reminder-notification-plan';

const CHANNEL_ID = 'reminders';
const ANDROID_IMPORTANCE_HIGH = 6 as Notifications.AndroidImportance;
const ANDROID_VISIBILITY_PUBLIC = 1 as Notifications.AndroidNotificationVisibility;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function mapPermission(
  status: Notifications.NotificationPermissionsStatus
): ReminderNotificationPermission {
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

function mapTap(
  response: Notifications.NotificationResponse | null
): ReminderNotificationTap | null {
  if (
    !response ||
    response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
  ) {
    return null;
  }

  const data = response.notification.request.content.data;
  if (
    !data ||
    data.kind !== 'reminder' ||
    typeof data.reminderId !== 'string' ||
    typeof data.scheduledFor !== 'string'
  ) {
    return null;
  }

  return {
    identifier: response.notification.request.identifier,
    reminderId: data.reminderId,
    scheduledFor: data.scheduledFor,
  };
}

export class ExpoReminderNotificationGateway
  implements IReminderNotificationGateway
{
  async ensureChannel(name: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name,
      importance: ANDROID_IMPORTANCE_HIGH,
      sound: 'default',
      enableVibrate: false,
      vibrationPattern: null,
      showBadge: false,
      bypassDnd: false,
      enableLights: false,
      lockscreenVisibility: ANDROID_VISIBILITY_PUBLIC,
    });
  }

  async getPermissionStatus(): Promise<ReminderNotificationPermission> {
    return mapPermission(await Notifications.getPermissionsAsync());
  }

  async requestPermission(): Promise<ReminderNotificationPermission> {
    const status = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
      },
    });
    return mapPermission(status);
  }

  async getScheduledReminderIdentifiers(): Promise<string[]> {
    const requests = await Notifications.getAllScheduledNotificationsAsync();
    return requests
      .map((request) => request.identifier)
      .filter(isReminderNotificationId);
  }

  async schedule(request: ReminderNotificationRequest): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: {
        title: request.title,
        body: request.body,
        sound: 'default',
        data: {
          kind: 'reminder',
          reminderId: request.reminderId,
          scheduledFor: request.scheduledFor,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(request.scheduledFor),
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
        delivery: 'bestEffort',
      },
    });
  }

  async cancel(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  getInitialTap(): ReminderNotificationTap | null {
    try {
      return mapTap(Notifications.getLastNotificationResponse());
    } catch {
      return null;
    }
  }

  addTapListener(
    listener: (tap: ReminderNotificationTap) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const tap = mapTap(response);
        if (tap) listener(tap);
      }
    );
    return () => subscription.remove();
  }

  clearInitialTap(): void {
    try {
      Notifications.clearLastNotificationResponse();
    } catch {
      // La respuesta nativa ya no existe.
    }
  }
}
