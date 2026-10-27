import {
  ChartColumn,
  CreditCard,
  Home,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { TranslationKey } from '@/core/i18n/translations';

/**
 * Configuración única de las pestañas. La barra (AppTabBar) y el layout solo
 * consumen esta lista: para cambiar un tab, su ícono o su etiqueta alcanza
 * con tocar este archivo.
 */
export interface AppTabConfig {
  /** Nombre de la ruta dentro del layout `(tabs)`. */
  route: string;
  icon: LucideIcon;
  /** Clave de traducción para la etiqueta (ES/EN). */
  labelKey: TranslationKey;
}

export const APP_TABS: readonly AppTabConfig[] = [
  { route: 'index', icon: Home, labelKey: 'home' },
  { route: 'accounts', icon: CreditCard, labelKey: 'accountsTab' },
  { route: 'stats', icon: ChartColumn, labelKey: 'stats' },
  { route: 'settings', icon: SettingsIcon, labelKey: 'settings' },
];
