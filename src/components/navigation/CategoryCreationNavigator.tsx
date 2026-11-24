import { useEffect } from 'react';
import { router } from 'expo-router';
import { useCategoryCreationStore } from '@/store/categoryCreationStore';

const NAVIGATION_DELAY_MS = 300;

export function CategoryCreationNavigator() {
  const pendingType = useCategoryCreationStore((state) => state.pendingType);

  useEffect(() => {
    if (!pendingType) return;

    const timeout = setTimeout(() => {
      const type = useCategoryCreationStore.getState().consumePendingType();
      if (type) {
        router.push({ pathname: '/settings/category-form', params: { type } });
      }
    }, NAVIGATION_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [pendingType]);

  return null;
}
