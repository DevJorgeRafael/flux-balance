import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

export function useRestoreTransactionModalOnUnmount() {
  useEffect(
    () => () => {
      useDashboardStore.getState().restoreTransactionModalAfterCategory();
    },
    []
  );
}
