export const REMINDER_BATTERY_TIP_DISMISSED_KEY =
  'reminder_battery_tip_dismissed_v1';

export function isReminderBatteryTipVisible(
  activeReminderCount: number,
  dismissed: boolean
): boolean {
  return activeReminderCount > 0 && !dismissed;
}
