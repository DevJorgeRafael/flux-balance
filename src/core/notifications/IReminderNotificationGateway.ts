export type ReminderNotificationPermission =
  | 'granted'
  | 'denied'
  | 'undetermined';

export interface ReminderNotificationContent {
  title: string;
  body: string;
}

export interface ReminderNotificationRequest extends ReminderNotificationContent {
  identifier: string;
  reminderId: string;
  scheduledFor: string;
}

export interface ReminderNotificationTap {
  identifier: string;
  reminderId: string;
  scheduledFor: string;
}

export interface IReminderNotificationGateway {
  ensureChannel(): Promise<void>;
  getPermissionStatus(): Promise<ReminderNotificationPermission>;
  requestPermission(): Promise<ReminderNotificationPermission>;
  getScheduledReminderIdentifiers(): Promise<string[]>;
  schedule(request: ReminderNotificationRequest): Promise<void>;
  cancel(identifier: string): Promise<void>;
  getInitialTap(): ReminderNotificationTap | null;
  addTapListener(listener: (tap: ReminderNotificationTap) => void): () => void;
  clearInitialTap(): void;
}
