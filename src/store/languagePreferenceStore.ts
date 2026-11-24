import { create } from 'zustand';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  type LanguagePreference,
} from '@/core/preferences/preferences';

interface LanguagePreferenceState {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
}

export const useLanguagePreferenceStore = create<LanguagePreferenceState>((set) => ({
  preference: DEFAULT_LANGUAGE_PREFERENCE,
  setPreference: (preference) => set({ preference }),
}));
