import { create } from 'zustand';
import type { Category, CategoryType } from '@/core/models/category';

export interface CategoryCreationState {
  requestId: number;
  type: CategoryType | null;
  result: Category | null;
  resultRequestId: number | null;
  pickerReopenToken: number;
  pendingType: CategoryType | null;
  requestCategory: (type: CategoryType) => void;
  consumePendingType: () => CategoryType | null;
  notifyPickerReopen: () => void;
  setResult: (category: Category) => void;
  consumeResult: () => Category | null;
  clear: () => void;
}

export const useCategoryCreationStore = create<CategoryCreationState>((set, get) => ({
  requestId: 0,
  type: null,
  result: null,
  resultRequestId: null,
  pickerReopenToken: 0,
  pendingType: null,

  requestCategory: (type) =>
    set((state) => ({
      requestId: state.requestId + 1,
      type,
      result: null,
      resultRequestId: null,
      pickerReopenToken: 0,
      pendingType: type,
    })),

  consumePendingType: () => {
    const pendingType = get().pendingType;
    if (pendingType) set({ pendingType: null });
    return pendingType;
  },

  notifyPickerReopen: () =>
    set((state) => ({ pickerReopenToken: state.pickerReopenToken + 1 })),

  setResult: (category) =>
    set((state) =>
      state.requestId > 0
        ? { result: category, resultRequestId: state.requestId }
        : {}
    ),

  consumeResult: () => {
    const { result, resultRequestId, requestId } = get();
    if (!result || resultRequestId !== requestId) return null;
    set({ result: null, resultRequestId: null });
    return result;
  },

  clear: () =>
    set({
      requestId: 0,
      type: null,
      result: null,
      resultRequestId: null,
      pickerReopenToken: 0,
      pendingType: null,
    }),
}));
