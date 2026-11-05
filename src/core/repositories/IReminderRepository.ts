import type {
  CreateReminderDTO,
  Reminder,
  UpdateReminderDTO,
} from '../models/reminder';

export interface IReminderRepository {
  getAll(includeArchived?: boolean): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | null>;
  getDue(now?: string): Promise<Reminder[]>;
  create(data: CreateReminderDTO): Promise<Reminder>;
  update(id: string, data: UpdateReminderDTO): Promise<Reminder>;
  recordNotificationSent(id: string, sentAt?: string): Promise<Reminder | null>;
  reconcileNextRunAt(id: string, now?: Date): Promise<Reminder | null>;
  delete(id: string): Promise<void>;
}
