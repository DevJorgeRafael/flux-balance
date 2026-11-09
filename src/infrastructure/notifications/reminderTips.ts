import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isMiuiDevice } from '@/core/notifications/miui';
import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';

const MIUI_TIPS_SHOWN_KEY = 'reminder_miui_tips_shown_v1';

export async function claimMiuiReminderTip(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (
    !isMiuiDevice({
      manufacturer: Device.manufacturer,
      brand: Device.brand,
    })
  ) {
    return false;
  }

  try {
    if ((await getAppSetting(MIUI_TIPS_SHOWN_KEY)) === '1') return false;
    await setAppSetting(MIUI_TIPS_SHOWN_KEY, '1');
    return true;
  } catch (error) {
    console.error('Error checking MIUI reminder tip:', error);
    return false;
  }
}
