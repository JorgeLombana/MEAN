import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material Imports
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// Application Imports
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
  UpdateTaskDto,
} from '../../models/task.interface';
import { TaskService } from '../../services/task.service';

// Local Interface Imports
import {
  TaskFormDialogData,
  StatusOption,
  PriorityOption,
  FormFieldConfig,
  TagValidationResult,
} from '../../models/task-form-dialog.interfaces';

/**
 * Dialog component for creating and editing tasks with comprehensive form validation
 *
 * Key Features:
 * - Dynamic form validation with real-time feedback
 * - Tag management with duplicate detection
 * - Date/time validation for future dates
 * - Error handling with backend integration
 * - Responsive design with accessibility support
 */
@Component({
  selector: 'app-task-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './task-form-dialog.component.html',
})
export class TaskFormDialogComponent implements OnInit {
  private readonly tagInputRef =
    viewChild<ElementRef<HTMLInputElement>>('tagInput');

  // dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);

  // Reactive state management
  public readonly isSubmitting = signal(false);
  public readonly tags = signal<string[]>([]);
  public readonly tagError = signal<string | null>(null);

  // Form state
  public taskForm!: FormGroup;
  public readonly newTagControl = new FormControl('');

  // Computed values
  public readonly isEditMode = computed(() => this.data.mode === 'edit');
  public readonly isFormValid = computed(() => this.taskForm?.valid ?? false);
  public readonly canSubmit = computed(
    () => this.isFormValid() && !this.isSubmitting()
  );

  // Configuration objects
  private readonly FIELD_CONFIG: Record<string, FormFieldConfig> = {
    title: { maxLength: 100, minLength: 3, required: true },
    description: { maxLength: 500, required: false },
    tag: { maxLength: 20, minLength: 2, required: false },
  };

  private readonly MAX_TAGS = 10;

  // Form control getters with proper typing
  get titleControl(): FormControl {
    return this.taskForm.get('title') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.taskForm.get('description') as FormControl;
  }

  get dueDateControl(): FormControl {
    return this.taskForm.get('dueDate') as FormControl;
  }

  get statusControl(): FormControl {
    return this.taskForm.get('status') as FormControl;
  }

  get priorityControl(): FormControl {
    return this.taskForm.get('priority') as FormControl;
  }

  // Configuration arrays for dropdowns
  public readonly statusOptions: StatusOption[] = [
    {
      value: TaskStatus.PENDING,
      label: 'Pending',
      icon: 'schedule',
      class: 'pending',
    },
    {
      value: TaskStatus.IN_PROGRESS,
      label: 'In Progress',
      icon: 'play_circle',
      class: 'in-progress',
    },
  ];

  public readonly priorityOptions: PriorityOption[] = [
    {
      value: TaskPriority.LOW,
      label: 'Low',
      icon: 'keyboard_arrow_down',
      class: 'low',
    },
    {
      value: TaskPriority.MEDIUM,
      label: 'Medium',
      icon: 'remove',
      class: 'medium',
    },
    {
      value: TaskPriority.HIGH,
      label: 'High',
      icon: 'keyboard_arrow_up',
      class: 'high',
    },
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormWatchers();

    if (this.data.task) {
      this.prefillFormData();
    }
  }

  /**
   * Initializes the reactive form with comprehensive validation rules
   */
  private initializeForm(): void {
    this.taskForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(this.FIELD_CONFIG['title'].minLength!),
          Validators.maxLength(this.FIELD_CONFIG['title'].maxLength),
          this.trimmedValidator,
        ],
      ],
      description: [
        '',
        [Validators.maxLength(this.FIELD_CONFIG['description'].maxLength)],
      ],
      dueDate: ['', [Validators.required, this.futureDateValidator]],
      status: [TaskStatus.PENDING, [Validators.required]],
      priority: [TaskPriority.MEDIUM],
    });
  }

  /**
   * Sets up form watchers for real-time validation feedback
   */
  private setupFormWatchers(): void {
    // Clear tag errors when tag input changes
    this.newTagControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.tagError()) {
          this.tagError.set(null);
        }
      });
  }

  /**
   * Custom validator to ensure input is not just whitespace
   */
  private trimmedValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const trimmed = control.value.trim();
    if (trimmed.length === 0) {
      return { whitespace: true };
    }

    return null;
  }

  /**
   * Custom validator for future dates with timezone consideration
   */
  private futureDateValidator = (
    control: AbstractControl
  ): ValidationErrors | null => {
    if (!control.value) return null;

    const selectedDateTime = new Date(control.value);
    const now = new Date();

    // small buffer to account for processing time
    const minimumTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    if (selectedDateTime <= minimumTime) {
      return { pastDate: true };
    }

    return null;
  };

  /**
   * Prefills form with existing task data for edit mode
   */
  private prefillFormData(): void {
    if (!this.data.task) return;

    const task = this.data.task;
    const formattedDateTime = this.formatDateForInput(task.dueDate);

    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      dueDate: formattedDateTime,
      status: task.status,
      priority: task.priority,
    });

    // Set tags with validation
    this.tags.set([...task.tags]);
  }

  /**
   * Formats date for HTML5 datetime-local input
   */
  private formatDateForInput(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().slice(0, 16);
  }

  /**
   * Adds a new tag with comprehensive validation
   */
  public addTag(event: Event, input?: HTMLInputElement): void {
    event.preventDefault();

    const value = this.newTagControl.value?.trim();
    if (!value) return;

    const validationResult = this.validateTag(value);
    if (!validationResult.isValid) {
      this.tagError.set(validationResult.error!);
      return;
    }

    // Add the validated tag
    const currentTags = this.tags();
    this.tags.set([...currentTags, value]);

    // Clear input and focus for better UX
    this.clearTagInput();
    this.focusTagInput();
  }

  /**
   * Comprehensive tag validation
   */
  private validateTag(value: string): TagValidationResult {
    const currentTags = this.tags();
    const config = this.FIELD_CONFIG['tag'];

    if (value.length < config.minLength!) {
      return {
        isValid: false,
        error: `Tag must be at least ${config.minLength} characters long`,
      };
    }

    if (value.length > config.maxLength) {
      return {
        isValid: false,
        error: `Tag cannot exceed ${config.maxLength} characters`,
      };
    }

    if (currentTags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      return { isValid: false, error: 'Tag already exists' };
    }

    if (currentTags.length >= this.MAX_TAGS) {
      return { isValid: false, error: `Maximum ${this.MAX_TAGS} tags allowed` };
    }

    // Check for special characters that might cause issues
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
      return {
        isValid: false,
        error:
          'Tags can only contain letters, numbers, spaces, hyphens, and underscores',
      };
    }

    return { isValid: true };
  }

  /**
   * Removes a tag by index
   */
  public removeTag(index: number): void {
    if (index < 0 || index >= this.tags().length) return;

    const currentTags = this.tags();
    this.tags.set(currentTags.filter((_, i) => i !== index));
    this.tagError.set(null);
  }

  /**
   * Handles form submission with comprehensive error handling
   */
  public async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const taskData = this.buildTaskData();
      const result = await this.saveTask(taskData);

      if (result) {
        this.handleSubmissionSuccess(result);
      }
    } catch (error: any) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Builds task data from form values
   */
  private buildTaskData(): CreateTaskDto | UpdateTaskDto {
    const formValue = this.taskForm.value;

    return {
      ...formValue,
      tags: this.tags(),
      dueDate: new Date(formValue.dueDate),
      // Ensure trimmed values
      title: formValue.title.trim(),
      description: formValue.description?.trim() || '',
    };
  }

  /**
   * Saves task based on mode (create/edit)
   */
  private async saveTask(
    taskData: CreateTaskDto | UpdateTaskDto
  ): Promise<Task> {
    if (this.isEditMode()) {
      return await firstValueFrom(
        this.taskService.updateTask(
          this.data.task!._id!,
          taskData as UpdateTaskDto
        )
      );
    } else {
      return await firstValueFrom(
        this.taskService.createTask(taskData as CreateTaskDto)
      );
    }
  }

  /**
   * Handles successful form submission
   */
  private handleSubmissionSuccess(result: Task): void {
    this.dialogRef.close(result);
  }

  /**
   * Centralized error handling for form submission
   */
  private handleSubmissionError(error: any): void {
    console.error('Error saving task:', error);

    const errorMessage = this.extractErrorMessage(error);
    this.processValidationErrors(error);
    this.showErrorMessage(errorMessage);
  }

  /**
   * Extracts meaningful error messages from various error formats
   */
  private extractErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.details && Array.isArray(error.details)) {
      const fieldErrors = error.details
        .map((detail: any) => detail.message)
        .join('. ');
      return `Validation failed: ${fieldErrors}`;
    }

    // Status code specific messages
    const statusMessages: Record<number, string> = {
      400: 'Invalid data provided. Please check your input.',
      404: 'Task not found. It may have been deleted.',
      409: 'A conflict occurred. Please refresh and try again.',
      413: 'The data is too large. Please reduce the content size.',
      429: 'Too many requests. Please wait before trying again.',
      500: 'Server error occurred. Please try again later.',
    };

    return (
      statusMessages[error.status] || 'Failed to save task. Please try again.'
    );
  }

  /**
   * Processes backend validation errors and maps them to form controls
   */
  private processValidationErrors(error: any): void {
    if (!error.details || !Array.isArray(error.details)) return;

    error.details.forEach((detail: any) => {
      if (detail.field && this.taskForm.get(detail.field)) {
        const control = this.taskForm.get(detail.field);
        control?.setErrors({ serverError: detail.message });
        control?.markAsTouched();
      }
    });
  }

  /**
   * Handles dialog cancellation
   */
  public onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Utility method to mark all form fields as touched
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach((key) => {
      this.taskForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Clears the tag input field using modern viewChild
   */
  private clearTagInput(): void {
    this.newTagControl.setValue('');
    const tagInput = this.tagInputRef();
    if (tagInput?.nativeElement) {
      tagInput.nativeElement.value = '';
    }
  }

  /**
   * Focuses the tag input for better UX using modern viewChild
   */
  private focusTagInput(): void {
    setTimeout(() => {
      const tagInput = this.tagInputRef();
      tagInput?.nativeElement?.focus();
    });
  }

  /**
   * Shows error message with enhanced styling
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  /**
   * Gets character count for a form field
   */
  public getCharacterCount(fieldName: string): number {
    const control = this.taskForm.get(fieldName);
    return control?.value?.length || 0;
  }

  /**
   * Gets maximum character limit for a field
   */
  public getMaxLength(fieldName: string): number {
    return this.FIELD_CONFIG[fieldName]?.maxLength || 0;
  }

  /**
   * Checks if a form field has a specific error
   */
  public hasFieldError(fieldName: string, errorType: string): boolean {
    const control = this.taskForm.get(fieldName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  /**
   * Gets error message for a specific field
   */
  public getFieldErrorMessage(fieldName: string): string | null {
    const control = this.taskForm.get(fieldName);
    if (!control?.errors || !control.touched) return null;

    const errors = control.errors;

    if (errors['required'])
      return `${this.capitalizeField(fieldName)} is required`;
    if (errors['minlength'])
      return `${this.capitalizeField(fieldName)} must be at least ${
        errors['minlength'].requiredLength
      } characters long`;
    if (errors['maxlength'])
      return `${this.capitalizeField(fieldName)} cannot exceed ${
        errors['maxlength'].requiredLength
      } characters`;
    if (errors['pastDate']) return 'Due date and time must be in the future';
    if (errors['whitespace'])
      return `${this.capitalizeField(
        fieldName
      )} cannot be empty or just whitespace`;
    if (errors['serverError']) return errors['serverError'];

    return null;
  }

  /**
   * Capitalizes field names for error messages
   */
  private capitalizeField(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      dueDate: 'Due date and time',
      status: 'Status',
      priority: 'Priority',
    };

    return (
      fieldNames[fieldName] ||
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    );
  }
}

// Export interface for external use
export type { TaskFormDialogData };
