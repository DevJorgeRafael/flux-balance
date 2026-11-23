import type { CreateGoalDTO, Goal, UpdateGoalDTO } from '../models/goal';

export interface IGoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | null>;
  create(data: CreateGoalDTO): Promise<Goal>;
  update(id: string, data: UpdateGoalDTO): Promise<Goal>;
  delete(id: string): Promise<void>;
}
