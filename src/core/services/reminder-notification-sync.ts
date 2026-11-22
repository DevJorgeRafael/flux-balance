import type { IReminderNotificationGateway } from '../notifications/IReminderNotificationGateway';
import {
  buildReminderNotificationPlan,
  type BuildReminderNotificationPlanOptions,
  type ReminderNotificationPlan,
} from './reminder-notification-plan';

type NotificationGateway = Pick<
  IReminderNotificationGateway,
  'getScheduledReminderIdentifiers' | 'schedule' | 'cancel'
>;

export interface SyncReminderNotificationsOptions
  extends Omit<BuildReminderNotificationPlanOptions, 'scheduledIdentifiers'> {
  gateway: NotificationGateway;
}

export async function syncReminderNotifications({
  gateway,
  ...planOptions
}: SyncReminderNotificationsOptions): Promise<ReminderNotificationPlan> {
  const scheduledIdentifiers =
    await gateway.getScheduledReminderIdentifiers();
  const plan = buildReminderNotificationPlan({
    ...planOptions,
    scheduledIdentifiers,
  });

  for (const identifier of plan.toCancel) {
    await gateway.cancel(identifier);
  }
  for (const request of plan.toSchedule) {
    await gateway.schedule(request);
  }

  return plan;
}
