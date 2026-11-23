import { create } from 'zustand';
import { DEFAULT_CURRENCY_CODE } from '@/core/constants/currencies';

interface CurrencyState {
  code: string;
  setCode: (code: string) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  code: DEFAULT_CURRENCY_CODE,
  setCode: (code) => set({ code }),
}));
