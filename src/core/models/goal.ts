export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  name: string;
  targetAmount: number;
  deadline: string;
  accountId?: string | null;
}

export interface UpdateGoalDTO {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  accountId?: string | null;
}
