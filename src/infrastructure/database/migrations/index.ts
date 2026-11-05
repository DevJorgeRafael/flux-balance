import type { Migration } from '../migrationRunner';
import { migration as baseline } from './001_baseline';
import { migration as appSettings } from './002_app_settings';
import { migration as reminders } from './003_reminders';

export const MIGRATIONS: readonly Migration[] = [
  baseline,
  appSettings,
  reminders,
];
