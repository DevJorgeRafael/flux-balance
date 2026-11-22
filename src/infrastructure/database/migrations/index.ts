import type { Migration } from '../migrationRunner';
import { migration as baseline } from './001_baseline';
import { migration as appSettings } from './002_app_settings';
import { migration as reminders } from './003_reminders';
import { migration as budgets } from './004_budgets';

export const MIGRATIONS: readonly Migration[] = [
  baseline,
  appSettings,
  reminders,
  budgets,
];
