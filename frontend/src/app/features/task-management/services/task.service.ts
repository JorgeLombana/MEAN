import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  Task,
  TaskFilters,
  CreateTaskDto,
  UpdateTaskDto,
} from '../models/task.interface';
import {
  BackendResponse,
  PaginatedTasksResponse,
  ApiResponse,
} from '../models/task-service.interface';
import { environment } from '../../../../environments/environment';

/**
 * Service for handling task-related HTTP operations
 */
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  private snackBar = inject(MatSnackBar);

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
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}`, task).pipe(
      map((response) => {
        // Show success message if available
        if (response.message) {
          this.showSuccessMessage(response.message);
        }
        return response.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, task).pipe(
      map((response) => {
        if (response.message) {
          this.showSuccessMessage(response.message);
        }
        return response.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        this.showSuccessMessage('Task deleted successfully');
        return;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getTaskHistory(id: string): Observable<{ history: any[] }> {
    return this.http
      .get<BackendResponse<{ history: any[] }>>(`${this.apiUrl}/${id}/history`)
      .pipe(map((response) => response.data));
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

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: any[] = [];

    console.error('Task service error:', error);

    if (error.error) {
      const backendError = error.error;

      if (backendError.message) {
        errorMessage = backendError.message;
      }

      if (backendError.errors && Array.isArray(backendError.errors)) {
        errorDetails = backendError.errors;
        const fieldErrors = backendError.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join(', ');
        if (fieldErrors) {
          errorMessage = `Validation failed: ${fieldErrors}`;
        }
      }

      // Handle specific error cases
      switch (error.status) {
        case 400:
          if (!backendError.message) {
            errorMessage = 'Invalid request data';
          }
          break;
        case 404:
          errorMessage = backendError.message || 'Task not found';
          break;
        case 409:
          errorMessage =
            backendError.message || 'Conflict: Resource already exists';
          break;
        case 429:
          errorMessage =
            backendError.message ||
            'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Create enhanced error object with backend details
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).details = errorDetails;
    (enhancedError as any).status = error.status;
    (enhancedError as any).originalError = error;

    return throwError(() => enhancedError);
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
