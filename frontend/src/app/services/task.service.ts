import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Task,
  TaskFilters,
  CreateTaskDto,
  UpdateTaskDto,
} from '../models/task.interface';
import {
  BackendResponse,
  PaginatedTasksResponse,
} from '../models/task-service.interface';
import { environment } from '../../environments/environment';

/**
 * Service for handling task-related HTTP operations
 */
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  /**
   * Retrieves tasks with filtering, pagination and sorting support
   */
  getTasks(
    filters?: TaskFilters,
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedTasksResponse> {
    const params = this.buildQueryParams(filters, page, limit);

    return this.http
      .get<BackendResponse<Task[]>>(this.apiUrl, { params })
      .pipe(map(this.transformTasksResponse));
  }

  getTask(id: string): Observable<Task> {
    return this.http
      .get<BackendResponse<Task>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http
      .post<BackendResponse<Task>>(this.apiUrl, task)
      .pipe(map((response) => response.data));
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<Task> {
    return this.http
      .put<BackendResponse<Task>>(`${this.apiUrl}/${id}`, task)
      .pipe(map((response) => response.data));
  }

  deleteTask(id: string): Observable<void> {
    return this.http
      .delete<BackendResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  /**
   * Builds HTTP query parameters from filters and pagination options
   */
  private buildQueryParams(
    filters?: TaskFilters,
    page: number = 1,
    limit: number = 10
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (!filters) return params;

    // Add filter parameters
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }

    if (filters.tags?.length) {
      params = params.set('tags', filters.tags.join(','));
    }

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }

    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return params;
  }

  /**
   * Transforms backend response to expected format with fallback values
   */
  private transformTasksResponse = (
    response: BackendResponse<Task[]>
  ): PaginatedTasksResponse => ({
    tasks: response.data || [],
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: false,
    },
  });
}
