import type { Category } from '@/core/models/category';
import { useCategoryCreationStore } from '@/store/categoryCreationStore';
import { useDashboardStore } from '@/store/dashboardStore';

export function publishCreatedCategory(category: Category): void {
  const handoff = useCategoryCreationStore.getState();
  if (handoff.requestId > 0) {
    handoff.setResult(category);
    handoff.notifyPickerReopen();
    useDashboardStore.getState().restoreTransactionModalAfterCategory(
      handoff.type ?? undefined
    );
  }
  void useDashboardStore.getState().refreshData();
}
