import {
  Component,
  OnInit,
  AfterViewInit,
  signal,
  computed,
  inject,
  DestroyRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Angular Material Imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application Imports
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilters,
} from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { PaginatedTasksResponse } from '../../models/task-service.interface';
import {
  TaskFormDialogComponent,
  TaskFormDialogData,
} from '../../components/task-form-dialog/task-form-dialog.component';
import {
  TaskHistoryDialogComponent,
  TaskHistoryDialogData,
} from '../../components/task-history-dialog/task-history-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '../../../../shared/interfaces/confirmation-dialog-data.interface';

/**
 * Component for displaying and managing a list of tasks.
 * Supports filtering, sorting, pagination, and CRUD operations on tasks.
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit, AfterViewInit {
  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Form controls for filters
  public readonly searchControl = new FormControl('');
  public readonly statusControl = new FormControl('');
  public readonly priorityControl = new FormControl('');

  // Reactive state management with signals
  public readonly tasks = signal<Task[]>([]);
  public readonly filters = signal<TaskFilters>({});
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);
  public readonly totalItems = signal<number>(0);
  public readonly totalPages = signal<number>(0);
  public readonly hasNext = signal<boolean>(false);
  public readonly hasPrev = signal<boolean>(false);
  public readonly isLoadingTasks = signal<boolean>(false);
  private readonly activeQuickFilter = signal<string | null>(null);

  // Computed properties
  public readonly dataSource = computed(() => {
    return new MatTableDataSource<Task>(this.tasks());
  });

  public readonly hasActiveFilters = computed(() => {
    const currentFilters = this.filters();
    return !!(
      currentFilters.search ||
      currentFilters.status ||
      currentFilters.priority ||
      (currentFilters.tags && currentFilters.tags.length > 0) ||
      currentFilters.sortBy ||
      this.activeQuickFilter()
    );
  });

  public readonly activeFiltersCount = computed(() => {
    const currentFilters = this.filters();
    const conditions: boolean[] = [
      !!currentFilters.search,
      !!currentFilters.status,
      !!currentFilters.priority,
      !!(currentFilters.tags && currentFilters.tags.length > 0),
      !!currentFilters.sortBy,
      !!this.activeQuickFilter(),
    ];
    return conditions.filter((isActive) => isActive).length;
  });

  public readonly completedTasksCount = computed(() => {
    return this.tasks().filter((task) => task.status === TaskStatus.COMPLETED)
      .length;
  });

  public readonly paginationEndIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  public readonly displayedColumns: string[] = [
    'title',
    'status',
    'priority',
    'dueDate',
    'tags',
    'actions',
  ];
  public readonly statusOptions = Object.values(TaskStatus);
  public readonly priorityOptions = Object.values(TaskPriority);

  private readonly destroy$ = new Subject<void>();
  private skipNextPageEvent = false;

  constructor() {
    // Register cleanup callback for component destruction
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });

    this.initializeFormControlsListeners();
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  ngAfterViewInit(): void {
    // Ensure Material components are fully initialized
    setTimeout(() => {
      this.connectPaginator();
      this.connectSort();
    });
  }

  /**
   * Sets up reactive form control listeners with debouncing for search
   */
  private initializeFormControlsListeners(): void {
    // Search with debouncing to avoid excessive API calls
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.updateFilters({ search: searchTerm || undefined });
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.updateFilters({
          status: status ? (status as TaskStatus) : undefined,
        });
      });

    this.priorityControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((priority) => {
        this.updateFilters({
          priority: priority ? (priority as TaskPriority) : undefined,
        });
      });
  }

  private connectPaginator(): void {
    const paginatorInstance = this.paginator();
    if (paginatorInstance?.page) {
      paginatorInstance.page
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: PageEvent) => {
          if (!this.skipNextPageEvent) {
            this.handlePageEvent(event);
          }
          this.skipNextPageEvent = false;
        });
    }
  }

  private connectSort(): void {
    const sortInstance = this.sort();
    if (sortInstance && this.dataSource()) {
      this.dataSource().sort = sortInstance;
    }
  }

  /**
   * Main method to load tasks with current filters and pagination
   */
  public loadTasks(): void {
    if (this.isLoadingTasks()) return;

    this.isLoadingTasks.set(true);

    this.taskService
      .getTasks(this.filters(), this.currentPage(), this.pageSize())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedTasksResponse) =>
          this.handleTasksResponse(response),
        error: (error) => this.handleTasksError(error),
        complete: () => this.isLoadingTasks.set(false),
      });
  }

  /**
   * Handles server-side sorting changes from MatSort
   */
  public handleSortChange(sortState: Sort): void {
    if (this.isLoadingTasks()) return;

    const sortBy = sortState.direction
      ? (sortState.active as TaskFilters['sortBy'])
      : undefined;
    const sortOrder = sortState.direction
      ? (sortState.direction as TaskFilters['sortOrder'])
      : undefined;

    this.filters.update((current) => ({
      ...current,
      sortBy,
      sortOrder,
    }));

    this.currentPage.set(1);
    this.loadTasks();
  }

  /**
   * Clears all active filters and resets pagination
   */
  public clearFilters(): void {
    if (this.isLoadingTasks()) return;

    // Reset form controls without triggering valueChanges
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.priorityControl.setValue('', { emitEvent: false });

    this.filters.set({});
    this.activeQuickFilter.set(null);
    this.currentPage.set(1);
    this.loadTasks();
  }

  public clearSearchFilter(): void {
    this.searchControl.setValue('');
  }

  /**
   * Applies quick filter presets (overdue, today, high-priority)
   */
  public applyQuickFilter(filterType: string): void {
    const currentActiveQuickFilter = this.activeQuickFilter();
    const newActiveQuickFilter =
      currentActiveQuickFilter === filterType ? null : filterType;
    this.activeQuickFilter.set(newActiveQuickFilter);

    const existingFilters = this.filters();
    const baseFilters: TaskFilters = {
      search: existingFilters.search,
      sortBy: existingFilters.sortBy,
      sortOrder: existingFilters.sortOrder,
    };

    if (newActiveQuickFilter) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      switch (newActiveQuickFilter) {
        case 'overdue':
          baseFilters.endDate = new Date();
          baseFilters.status = TaskStatus.PENDING;
          break;
        case 'today':
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          baseFilters.startDate = startOfDay;
          baseFilters.endDate = today;
          break;
        case 'high-priority':
          baseFilters.priority = TaskPriority.HIGH;
          break;
      }
      this.filters.set(baseFilters);
    } else {
      this.filters.set({
        search: existingFilters.search,
        sortBy: existingFilters.sortBy,
        sortOrder: existingFilters.sortOrder,
        status: existingFilters.status,
        priority: existingFilters.priority,
        startDate: undefined,
        endDate: undefined,
      });
    }

    this.currentPage.set(1);
    this.loadTasks();
  }
  // Task CRUD operations
  public createTask(): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create',
      } as TaskFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  public editTask(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        task: task,
        mode: 'edit',
      } as TaskFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  /**
   * Deletes a task with user confirmation using enhanced Material dialog
   * Implements proper error handling and user feedback
   *
   * @param task - The task to be deleted
   */
  public async deleteTask(task: Task): Promise<void> {
    // Guard clause to prevent multiple simultaneous operations
    if (this.isLoadingTasks()) {
      return;
    }

    try {
      // Open confirmation dialog with enhanced messaging
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
        panelClass: 'custom-confirmation-dialog',
        data: {
          title: 'Delete Task',
          message: `Are you sure you want to permanently delete "<strong>${task.title}</strong>"?<br><br><span class="text-gray-500 text-xs">This action cannot be undone and will remove all associated data.</span>`,
          confirmButtonText: 'Delete Task',
          cancelButtonText: 'Keep Task',
          confirmButtonColor: 'warn',
        } as ConfirmationDialogData,
      });

      const isConfirmed = await dialogRef.afterClosed().toPromise();

      if (isConfirmed) {
        await firstValueFrom(this.taskService.deleteTask(task._id!));
        this.loadTasks();
      }
    } catch (error: any) {
      this.handleError(error, `Failed to delete task "${task.title}"`);
    }
  }

  public viewTaskHistory(task: Task): void {
    const dialogRef = this.dialog.open(TaskHistoryDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        task: task,
      } as TaskHistoryDialogData,
    });

    // Optional: Handle any actions after dialog closes
    dialogRef.afterClosed().subscribe((result) => {
      // No action needed for history dialog
    });
  }

  // CSS helper methods for status and priority styling
  public getStatusClass(status: TaskStatus): string {
    const baseClasses = 'inline-block';
    switch (status) {
      case TaskStatus.PENDING:
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case TaskStatus.IN_PROGRESS:
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case TaskStatus.COMPLETED:
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  }

  public getPriorityClass(priority: TaskPriority): string {
    const baseClasses = 'inline-block';
    switch (priority) {
      case TaskPriority.LOW:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`;
      case TaskPriority.MEDIUM:
        return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
      case TaskPriority.HIGH:
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  }

  /**
   * Returns appropriate CSS classes for due date based on overdue status
   */
  public getDueDateClass(task: Task): string {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < now && task.status !== TaskStatus.COMPLETED;

    if (isOverdue) {
      return 'text-red-600 font-medium';
    } else if (task.status === TaskStatus.COMPLETED) {
      return 'text-green-600';
    }
    return 'text-gray-900';
  }

  public getQuickFilterClass(filterType: string): string {
    const baseClasses =
      'inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out';
    const activeClasses = 'border-indigo-600 text-indigo-600 bg-indigo-50';
    const inactiveClasses =
      'border-gray-300 text-gray-700 bg-white hover:bg-gray-50';

    return this.activeQuickFilter() === filterType
      ? `${baseClasses} ${activeClasses}`
      : `${baseClasses} ${inactiveClasses}`;
  }

  public getCompletedTasksCount(): number {
    return this.completedTasksCount();
  }

  // Private helper methods
  private updateFilters(newFilterValues: Partial<TaskFilters>): void {
    this.filters.update((current) => ({ ...current, ...newFilterValues }));
    this.currentPage.set(1);
    this.loadTasks();
  }

  /**
   * Processes server response and updates component state
   */
  private handleTasksResponse(response: PaginatedTasksResponse): void {
    this.tasks.set(response.tasks);
    this.totalItems.set(response.pagination.total);
    this.totalPages.set(response.pagination.pages);
    this.hasNext.set(response.pagination.hasNext);
    this.hasPrev.set(response.pagination.hasPrev);

    if (this.currentPage() !== response.pagination.page) {
      this.currentPage.set(response.pagination.page);
    }
    this.updatePaginatorSilently();
    this.connectSort();

    // Reconnect paginator if needed
    const paginatorInstance = this.paginator();
    if (paginatorInstance && !paginatorInstance.page.observers.length) {
      this.connectPaginator();
    }
  }

  private resetTasksState(): void {
    this.tasks.set([]);
    this.totalItems.set(0);
    this.totalPages.set(0);
    this.hasNext.set(false);
    this.hasPrev.set(false);
  }

  /**
   * Updates paginator without triggering page events to prevent loops
   */
  private updatePaginatorSilently(): void {
    const paginatorInstance = this.paginator();
    if (paginatorInstance) {
      this.skipNextPageEvent = true;
      paginatorInstance.pageIndex = this.currentPage() - 1;
      paginatorInstance.length = this.totalItems();
      paginatorInstance.pageSize = this.pageSize();
    }
  }

  public onPageEvent(event: PageEvent): void {
    this.handlePageEvent(event);
  }

  private handlePageEvent(event: PageEvent): void {
    if (this.isLoadingTasks()) return;

    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadTasks();
  }

  public goToPreviousPage(): void {
    if (this.hasPrev() && !this.isLoadingTasks()) {
      const newPageIndex = this.currentPage() - 2;
      this.handlePageEvent({
        pageIndex: newPageIndex,
        pageSize: this.pageSize(),
        length: this.totalItems(),
      } as PageEvent);
    }
  }

  public goToNextPage(): void {
    if (this.hasNext() && !this.isLoadingTasks()) {
      const newPageIndex = this.currentPage();
      this.handlePageEvent({
        pageIndex: newPageIndex,
        pageSize: this.pageSize(),
        length: this.totalItems(),
      } as PageEvent);
    }
  }

  private handleTasksError(error: any): void {
    console.error('Error loading tasks:', error);
    this.isLoadingTasks.set(false);
  }

  /**
   * Handles errors with backend message display
   */
  private handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific error cases
    if (error.status === 404) {
      errorMessage = 'Task not found. It may have already been deleted.';
      this.loadTasks(); // Refresh the list
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 500) {
      errorMessage = 'Server error occurred. Please try again later.';
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
