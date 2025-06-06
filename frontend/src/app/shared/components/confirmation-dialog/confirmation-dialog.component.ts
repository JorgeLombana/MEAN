import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ConfirmationDialogData } from '../../interfaces/confirmation-dialog-data.interface';

/**
 * Reusable confirmation dialog component following Material Design principles.
 *
 * Features:
 * - Accessible with proper ARIA labels and focus management
 * - Responsive design for mobile and desktop
 * - Customizable button text and colors
 * - HTML content support in messages
 * - Smooth animations and transitions
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
 *   data: {
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     confirmButtonText: 'Delete',
 *     cancelButtonText: 'Cancel'
 *   }
 * });
 *
 * const result = await dialogRef.afterClosed().toPromise();
 * if (result) {
 *   // User confirmed the action
 * }
 * ```
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ConfirmationDialogComponent>
  );

  public readonly dialogData = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  public handleConfirm(): void {
    this.dialogRef.close(true);
  }

  public handleCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Generates accessible aria-label for the cancel button
   * @returns Descriptive label for screen readers
   */
  public getCancelButtonAriaLabel(): string {
    return `Cancel action: ${this.dialogData.title}`;
  }

  /**
   * Generates accessible aria-label for the confirm button
   * @returns Descriptive label for screen readers
   */
  public getConfirmButtonAriaLabel(): string {
    const action = this.dialogData.confirmButtonText || 'Confirm';
    return `${action} action: ${this.dialogData.title}`;
  }
}
