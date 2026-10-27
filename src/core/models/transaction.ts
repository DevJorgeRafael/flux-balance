export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TransactionSplit {
  id: string;
  transactionId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  notes?: string | null;
  // Hydrated references (optional, when joined)
  accountName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  totalAmount: number;
  description?: string | null;
  date: string; // ISO date / datetime
  createdAt: string;
  splits: TransactionSplit[];
}

export interface CreateTransactionSplitDTO {
  accountId: string;
  categoryId?: string;
  amount: number;
  notes?: string;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  totalAmount: number;
  description?: string;
  date: string;
  splits: CreateTransactionSplitDTO[];
}

export interface TransactionFilterDTO {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
