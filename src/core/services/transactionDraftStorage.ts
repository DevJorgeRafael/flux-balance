import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import {
  parseTransactionDraft,
  serializeTransactionDraft,
  type TransactionDraft,
} from './transactionDraft';

const TRANSACTION_DRAFT_KEY = 'transactionDraft';

export async function loadTransactionDraft(): Promise<TransactionDraft | null> {
  try {
    return parseTransactionDraft(await getAppSetting(TRANSACTION_DRAFT_KEY));
  } catch (error) {
    console.error('Error loading transaction draft:', error);
    return null;
  }
}

export async function saveTransactionDraft(draft: TransactionDraft): Promise<void> {
  await setAppSetting(TRANSACTION_DRAFT_KEY, serializeTransactionDraft(draft));
}
