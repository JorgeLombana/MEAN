export interface Task {
  _id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  history?: TaskHistoryEntry[];
  isOverdue?: boolean;
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface TaskHistoryEntry {
  _id?: string;
  action: 'created' | 'updated' | 'status_changed';
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  tags: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}
