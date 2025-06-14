import { Task } from './task.interface';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
  requestId?: string;
  version?: string;
}

export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  requestId: string;
  version: string;
}

export interface PaginatedTasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
