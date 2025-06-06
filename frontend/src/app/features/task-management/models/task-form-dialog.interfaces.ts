import { Task, TaskStatus, TaskPriority } from './task.interface';

export interface TaskFormDialogData {
  task?: Task;
  mode: 'create' | 'edit';
}

export interface StatusOption {
  value: TaskStatus;
  label: string;
  icon: string;
  class: string;
}

export interface PriorityOption {
  value: TaskPriority;
  label: string;
  icon: string;
  class: string;
}

export interface FormFieldConfig {
  maxLength: number;
  minLength?: number;
  required: boolean;
}

export interface TagValidationResult {
  isValid: boolean;
  error?: string;
}
