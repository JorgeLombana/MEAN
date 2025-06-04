import mongoose from 'mongoose';

/**
 * @typedef {object} HistoryRecord
 * @property {string} action - The type of action: 'created', 'updated', 'status_changed'.
 * @property {string} [field] - The field that was changed (for 'updated', 'status_changed').
 * @property {mongoose.Schema.Types.Mixed} [oldValue] - The previous value of the field.
 * @property {mongoose.Schema.Types.Mixed} [newValue] - The new value of the field.
 * @property {Date} timestamp - Timestamp of the change.
 */

/**
 * Mongoose sub-schema for tracking the history of changes to a task.
 * @type {mongoose.Schema<HistoryRecord>}
 */
const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed'],
      required: [true, 'History action is required.'],
    },
    field: { // Relevant for 'updated' and 'status_changed' actions
      type: String,
      required: function() { return this.action === 'updated' || this.action === 'status_changed'; },
    },
    oldValue: { // Relevant for 'updated' and 'status_changed' actions
      type: mongoose.Schema.Types.Mixed,
      // `required` can be tricky here as oldValue might legitimately be null/undefined
    },
    newValue: { // Relevant for 'updated', 'status_changed', and 'created' (for initial state)
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // Each history entry gets its own unique ID
);

/**
 * @typedef {object} Task
 * @property {string} title - The title of the task.
 * @property {string} [description] - Optional description of the task.
 * @property {'Pending'|'In Progress'|'Completed'} status - Current status of the task.
 * @property {'Low'|'Medium'|'High'} [priority] - Priority of the task.
 * @property {Date} dueDate - The due date for the task.
 * @property {string[]} [tags] - Array of tags for categorization.
 * @property {HistoryRecord[]} history - Log of changes made to the task.
 * @property {boolean} isOverdue - Virtual property indicating if the task is overdue.
 */

/**
 * Mongoose schema for tasks.
 * Includes fields for title, description, status, priority, due date, tags, and history.
 * Timestamps (createdAt, updatedAt) are automatically managed.
 * @type {mongoose.Schema<Task>}
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required and cannot be empty.'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long.'],
      maxlength: [100, 'Title cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be one of: Pending, In Progress, or Completed. Received value: {VALUE}',
      },
      required: [true, 'Status is required.'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be one of: Low, Medium, or High. Received value: {VALUE}',
      },
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required and cannot be empty.'],
      validate: {
        validator: function (value) {
          // Validate only if dueDate is new or modified to prevent validation on every save
          if (this.isNew || this.isModified('dueDate')) {
            return value instanceof Date && value.getTime() > Date.now();
          }
          return true;
        },
        message: props => `Due date (${props.value}) must be a future date.`,
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tagsArray) {
          if (!tagsArray || tagsArray.length === 0) return true; // Empty array is valid

          // Normalize and check for empty strings and uniqueness
          const cleanTags = tagsArray
            .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
            .filter((tag) => tag.length > 0);
          
          if (cleanTags.some(tag => tag === '')) { // Should be caught by filter, but as safeguard
              return false; // No empty strings allowed if array is not empty
          }
          return cleanTags.length === new Set(cleanTags).size; // Check uniqueness
        },
        message: 'Tags must be an array of unique, non-empty strings (case-insensitive).',
      },
    },
    history: [historySchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true, // Ensure virtuals are included in toJSON() output
      transform: function (doc, ret) {
        delete ret.__v; // Remove __v from JSON output
        // ret.id = ret._id; // Optionally map _id to id
        // delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true }, // Ensure virtuals are included in toObject() output
  }
);

/**
 * Virtual property to determine if a task is overdue.
 * A task is overdue if its due date is in the past and its status is not 'Completed'.
 * @returns {boolean} True if the task is overdue, false otherwise.
 */
taskSchema.virtual('isOverdue').get(function () {
  // Ensure dueDate is valid before comparison
  return this.dueDate && this.dueDate < new Date() && this.status !== 'Completed';
});

// Indexes for optimized querying as per requirements
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ tags: 1 }); // For filtering by tags
taskSchema.index({ createdAt: -1 }); // For sorting by creation date

// Text index for searching title and description (if using MongoDB text search feature)
// taskSchema.index({ title: 'text', description: 'text' }); // Uncomment if using $text search in repository

/**
 * Pre-save middleware for the task schema.
 * 1. Normalizes tags: Converts to lowercase, trims whitespace, filters empty strings, and ensures uniqueness.
 * 2. Tracks history: Logs creation or updates to task fields.
 */
taskSchema.pre('save', async function (next) {
  try {
    // Normalize tags if modified or new
    if (this.isModified('tags') || this.isNew) {
      if (this.tags && Array.isArray(this.tags)) {
        this.tags = this.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter((tag) => tag.length > 0);
        this.tags = [...new Set(this.tags)]; // Ensure uniqueness
      } else {
        this.tags = []; // Default to empty array if tags are invalid/null
      }
    }

    if (this.isNew) {
      // For new documents, add a 'created' history record with the initial state
      this.history.push({
        action: 'created',
        // `newValue` for 'created' can represent the initial state of the document or key fields.
        newValue: { 
            title: this.title, 
            status: this.status, 
            priority: this.priority, 
            dueDate: this.dueDate,
            // Consider what constitutes the "initial value" for history.
        },
        // No 'field' or 'oldValue' for 'created' action
      });
    } else {
      // For updates, find the original document to compare changes
      // Use .findOne() and .lean() for efficiency if only reading the original.
      const original = await mongoose.model('Task').findById(this._id).lean().exec();

      if (original) {
        const modifiedPaths = this.modifiedPaths({ includeChildren: true }); // includeChildren for nested objects if any

        modifiedPaths.forEach((field) => {
          // Skip fields that are managed by Mongoose or are part of history itself
          if (field !== 'history' && field !== 'updatedAt' && field !== 'createdAt' && field !== '__v') {
            const oldValue = original[field];
            const newValue = this[field];

            // Deep comparison for objects/arrays might be needed if JSON.stringify is not robust enough
            // For simple types, direct comparison or JSON.stringify is usually fine.
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              this.history.push({
                action: field === 'status' ? 'status_changed' : 'updated',
                field: field,
                oldValue: oldValue,
                newValue: newValue,
              });
            }
          }
        });
      }
    }
    next();
  } catch (error) {
    // Pass errors to the next error-handling middleware or Mongoose's error handling
    next(new Error(`Error in Task pre-save middleware: ${error.message}`));
  }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
