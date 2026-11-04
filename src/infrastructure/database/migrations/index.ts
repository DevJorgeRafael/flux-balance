import type { Migration } from '../migrationRunner';
import { migration as baseline } from './001_baseline';
import { migration as appSettings } from './002_app_settings';

export const MIGRATIONS: readonly Migration[] = [baseline, appSettings];
