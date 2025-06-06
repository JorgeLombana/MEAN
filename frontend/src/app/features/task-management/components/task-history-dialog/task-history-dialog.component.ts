import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material Imports
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Application Imports
import { Task, TaskHistoryEntry } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';

// Types and Interfaces
export interface TaskHistoryDialogData {
  task: Task;
}

interface HistoryRecord extends TaskHistoryEntry {
  _id: string; // Required for display tracking
}

type HistoryAction = 'created' | 'status_changed' | 'updated';
type FieldType = 'tags' | 'priority' | 'dueDate' | 'title' | 'description';

interface ActionIconConfig {
  name: string;
  colorClass: string;
}

/**
 * Dialog component for displaying task change history in a timeline format
 */
@Component({
  selector: 'app-task-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './task-history-dialog.component.html',
})
export class TaskHistoryDialogComponent implements OnInit {
  // dependency injection
  private readonly taskService = inject(TaskService);
  private readonly dialogRef = inject(MatDialogRef<TaskHistoryDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<TaskHistoryDialogData>(MAT_DIALOG_DATA);

  // Reactive state management
  public readonly isLoading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly historyRecords = signal<HistoryRecord[]>([]);

  // Computed values
  public readonly hasHistoryData = computed(
    () => this.historyRecords().length > 0
  );
  public readonly isEmptyState = computed(
    () => !this.isLoading() && !this.error() && !this.hasHistoryData()
  );

  // Configuration objects
  private readonly ACTION_ICONS: Record<HistoryAction, ActionIconConfig> = {
    created: {
      name: 'add_circle',
      colorClass: 'bg-blue-100 text-blue-600 border-blue-200',
    },
    status_changed: {
      name: 'check_circle',
      colorClass: 'bg-green-100 text-green-600 border-green-200',
    },
    updated: {
      name: 'edit',
      colorClass: 'bg-gray-100 text-gray-600 border-gray-200',
    },
  };

  private readonly FIELD_ICONS: Record<FieldType, ActionIconConfig> = {
    tags: {
      name: 'local_offer',
      colorClass: 'bg-purple-100 text-purple-600 border-purple-200',
    },
    priority: {
      name: 'priority_high',
      colorClass: 'bg-red-100 text-red-600 border-red-200',
    },
    dueDate: {
      name: 'event',
      colorClass: 'bg-amber-100 text-amber-600 border-amber-200',
    },
    title: {
      name: 'title',
      colorClass: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    },
    description: {
      name: 'description',
      colorClass: 'bg-teal-100 text-teal-600 border-teal-200',
    },
  };

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Loads task history with comprehensive error handling
   * Supports multiple data sources and response formats
   */
  public async loadHistory(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const history = await this.fetchHistoryData();
      const processedHistory = this.processHistoryData(history);
      this.historyRecords.set(processedHistory);
    } catch (error) {
      this.handleHistoryError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetches history data from multiple sources with fallback strategy
   */
  private async fetchHistoryData(): Promise<TaskHistoryEntry[]> {
    // Primary source: task object history
    if (this.hasValidTaskHistory()) {
      return this.data.task.history!;
    }

    // Fallback: API endpoints
    return await this.fetchFromApi();
  }

  private hasValidTaskHistory(): boolean {
    return Boolean(this.data.task.history && this.data.task.history.length > 0);
  }

  private async fetchFromApi(): Promise<TaskHistoryEntry[]> {
    try {
      const historyData = await this.callHistoryApi();
      return this.extractHistoryFromResponse(historyData);
    } catch (apiError) {
      console.warn('API history fetch failed:', apiError);
      return []; // Graceful degradation
    }
  }

  private async callHistoryApi(): Promise<any> {
    const taskId = this.data.task._id!;

    // Try dedicated history endpoint first
    if (this.taskService.getTaskHistory) {
      return await firstValueFrom(
        this.taskService
          .getTaskHistory(taskId)
          .pipe(takeUntilDestroyed(this.destroyRef))
      );
    }

    // Fallback to full task endpoint
    return await firstValueFrom(
      this.taskService.getTask(taskId).pipe(takeUntilDestroyed(this.destroyRef))
    );
  }

  /**
   * Extracts history data from various response formats
   */
  private extractHistoryFromResponse(response: any): TaskHistoryEntry[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.history && Array.isArray(response.history)) {
      return response.history;
    }

    if (response?.data?.history && Array.isArray(response.data.history)) {
      return response.data.history;
    }

    return [];
  }

  /**
   * Processes and validates history data for display
   */
  private processHistoryData(history: TaskHistoryEntry[]): HistoryRecord[] {
    return history
      .filter(this.isValidHistoryEntry)
      .map(this.transformToHistoryRecord)
      .reverse(); // Show newest first
  }

  private isValidHistoryEntry = (entry: TaskHistoryEntry): boolean => {
    return Boolean(entry._id && entry.action && entry.timestamp);
  };

  private transformToHistoryRecord = (
    entry: TaskHistoryEntry
  ): HistoryRecord => ({
    ...entry,
    _id: entry._id!,
  });

  /**
   * Gets icon configuration for history actions
   */
  public getActionIconName(record: HistoryRecord): string {
    if (record.action === 'updated' && record.field) {
      return (
        this.FIELD_ICONS[record.field as FieldType]?.name ||
        this.ACTION_ICONS.updated.name
      );
    }

    return this.ACTION_ICONS[record.action as HistoryAction]?.name || 'help';
  }

  /**
   * Gets CSS classes for action icons with field-specific styling
   */
  public getActionIconClass(record: HistoryRecord): string {
    const baseClasses = 'border-2';

    if (record.action === 'updated' && record.field) {
      const fieldConfig = this.FIELD_ICONS[record.field as FieldType];
      return `${baseClasses} ${
        fieldConfig?.colorClass || this.ACTION_ICONS.updated.colorClass
      }`;
    }

    const actionConfig = this.ACTION_ICONS[record.action as HistoryAction];
    return `${baseClasses} ${
      actionConfig?.colorClass || 'bg-gray-100 text-gray-600 border-gray-200'
    }`;
  }

  /**
   * Generates user-friendly action titles
   */
  public getActionTitle(record: HistoryRecord): string {
    const titleMap: Record<string, string> = {
      created: 'Task Created',
      status_changed: 'Status Changed',
      updated: record.field
        ? `${this.formatFieldName(record.field)} Updated`
        : 'Task Updated',
    };

    return titleMap[record.action] || 'Task Modified';
  }

  /**
   * Generates descriptive action messages
   */
  public getActionDescription(record: HistoryRecord): string {
    switch (record.action) {
      case 'created':
        return 'Task was created with initial values.';

      case 'status_changed':
        return `Status changed from "${record.oldValue}" to "${record.newValue}".`;

      case 'updated':
        return record.field
          ? `${this.formatFieldName(record.field)} was updated.`
          : 'Task details were modified.';

      default:
        return 'Task was modified.';
    }
  }

  /**
   * Formats field names for display with proper capitalization
   */
  public formatFieldName(field: string): string {
    const fieldNameMap: Record<string, string> = {
      dueDate: 'Due Date',
      createdAt: 'Created Date',
      updatedAt: 'Updated Date',
    };

    return (
      fieldNameMap[field] || field.charAt(0).toUpperCase() + field.slice(1)
    );
  }

  /**
   * Formats values based on field type with proper handling
   */
  public formatValue(field: string, value: any): string {
    if (value === null || value === undefined) {
      return 'Not set';
    }

    const formatters: Record<string, (val: any) => string> = {
      dueDate: (val) => new Date(val).toLocaleString(),
      createdAt: (val) => new Date(val).toLocaleString(),
      updatedAt: (val) => new Date(val).toLocaleString(),
      tags: (val) =>
        Array.isArray(val)
          ? val.length > 0
            ? val.join(', ')
            : 'No tags'
          : String(val),
    };

    return formatters[field]?.(value) || String(value);
  }

  /**
   * Formats timestamps for relative display (e.g., "2 hours ago")
   */
  public formatRelativeDate(timestamp: string | Date): string {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Formats full date for tooltips
   */
  public formatFullDate(timestamp: string | Date): string {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  }

  /**
   * Handles dialog closure
   */
  public onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Centralized error handling for history loading
   */
  private handleHistoryError(error: any): void {
    console.error('Error loading task history:', error);

    const errorMessage = this.getErrorMessage(error);
    this.error.set(errorMessage);
  }

  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }

    if (error?.status) {
      const statusMessages: Record<number, string> = {
        404: 'Task not found. It may have been deleted.',
        403: 'You do not have permission to view this task history.',
        500: 'Server error occurred. Please try again later.',
      };

      return statusMessages[error.status] || 'An unexpected error occurred.';
    }

    return 'Failed to load task history. Please try again.';
  }
}
