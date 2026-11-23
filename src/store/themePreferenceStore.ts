import { create } from 'zustand';
import {
  DEFAULT_THEME_PREFERENCE,
  type ThemePreference,
} from '@/core/preferences/preferences';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: DEFAULT_THEME_PREFERENCE,
  setPreference: (preference) => set({ preference }),
}));
