import { create } from 'zustand';
import type { ReminderNotificationPermission } from '@/core/notifications/IReminderNotificationGateway';

export interface RefreshReminderOptions {
  requestPermission?: boolean;
}

export type RefreshReminderNotifications = (
  reminderId?: string,
  options?: RefreshReminderOptions
) => Promise<ReminderNotificationPermission>;

interface ReminderNotificationsState {
  refreshReminderNotifications: RefreshReminderNotifications;
  register: (refresh: RefreshReminderNotifications) => void;
  unregister: () => void;
}

const NOOP_REFRESH: RefreshReminderNotifications = async () => 'undetermined';

export const useReminderNotificationsStore = create<ReminderNotificationsState>(
  (set) => ({
    refreshReminderNotifications: NOOP_REFRESH,
    register: (refresh) => set({ refreshReminderNotifications: refresh }),
    unregister: () => set({ refreshReminderNotifications: NOOP_REFRESH }),
  })
);

export function useReminderNotifications(): {
  refreshReminderNotifications: RefreshReminderNotifications;
} {
  const refreshReminderNotifications = useReminderNotificationsStore(
    (state) => state.refreshReminderNotifications
  );
  return { refreshReminderNotifications };
}
