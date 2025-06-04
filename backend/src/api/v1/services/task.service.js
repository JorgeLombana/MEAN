import taskRepository from '../../../repositories/taskRepository.js';
import mongoose from 'mongoose';

/**
 * Service layer for task-related business logic.
 * Handles data validation, manipulation, and interaction with the TaskRepository.
 */
class TaskService {
  /**
   * Creates a new task after performing necessary validations and data normalization.
   * @param {object} taskData - Raw task data from the request.
   * @returns {Promise<object>} The created task document.
   * @throws {Error} If validation fails or a database error occurs. Custom error properties (status, details) may be set.
   */
  async createTask(taskData) {
    try {
      // Apply default priority if not provided
      if (taskData.priority === undefined) { // Check for undefined to allow explicit null if desired by schema
        taskData.priority = 'Medium';
      }

      // Normalize tags: trim, lowercase, filter empty, and ensure uniqueness
      if (taskData.tags && Array.isArray(taskData.tags)) {
        taskData.tags = taskData.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter((tag) => tag.length > 0);
        taskData.tags = [...new Set(taskData.tags)];
      } else {
        taskData.tags = []; // Ensure tags is an empty array if not provided or invalid
      }

      // Validate due date is in the future (schema also validates this, but good for service layer check)
      if (taskData.dueDate && new Date(taskData.dueDate) <= new Date()) {
        const error = new Error('Due date must be a future date.');
        error.status = 400;
        error.details = [{ field: 'dueDate', message: error.message, value: taskData.dueDate }];
        throw error;
      }
      
      // The Mongoose schema handles required field validation (title, status, dueDate).
      // Additional complex business rule validations can be added here if not covered by schema or express-validator.

      return await taskRepository.create(taskData);
    } catch (error) {
      if (error.name === 'ValidationError') {
        // Re-throw Mongoose validation errors to be handled by the global error handler
        // or transform them into a consistent service error format if needed.
        const serviceError = new Error('Task validation failed.');
        serviceError.status = 400;
        serviceError.details = Object.values(error.errors).map((e) => ({
          field: e.path,
          message: e.message,
          value: e.value,
        }));
        throw serviceError;
      }
      // Propagate other errors (e.g., custom errors thrown above, database errors)
      throw error;
    }
  }

  /**
   * Retrieves a paginated and filtered list of tasks.
   * @param {object} [query={}] - Query parameters for filtering, sorting, and pagination.
   * @returns {Promise<{tasks: object[], pagination: object}>} Contains the list of tasks and pagination details.
   */
  async getAllTasks(query = {}) {
    try {
      const {
        status,
        priority,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        search,
        tags: tagsQuery, // Comma-separated string of tags
        sortBy = 'dueDate', // Default sort field
        sortOrder = 'asc',  // Default sort order
      } = query;

      let filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      if (startDate || endDate) {
        filter.dueDate = {};
        if (startDate) filter.dueDate.$gte = new Date(startDate);
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999); // Include the entire end day
            filter.dueDate.$lte = endOfDay;
        }
      }

      if (tagsQuery && typeof tagsQuery === 'string') {
        const tagsArray = tagsQuery
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
        if (tagsArray.length > 0) {
          filter.tags = { $in: tagsArray };
        }
      }
      
      // Text search for title and description.
      // If a text index is defined on the model, MongoDB's $text operator could be more efficient.
      // This implementation uses regex for flexibility if a text index isn't used or for partial matches.
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const textSearchCondition = {
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            // Note: Searching tags with regex here might be redundant if `filter.tags` is already set.
            // If `filter.tags` is set, this regex on tags might broaden the search unexpectedly or be inefficient.
            // Consider if tags should be part of this $or or handled exclusively by `filter.tags`.
            // For now, keeping it simple: if `search` is present, it searches title/desc.
            // If `tagsQuery` is also present, `filter.tags` will handle tag filtering.
          ],
        };
        // Combine text search with other filters
        if (Object.keys(filter).length > 0) {
            filter = { $and: [filter, textSearchCondition] };
        } else {
            filter = textSearchCondition;
        }
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      // Add a secondary sort key for consistent ordering if primary keys are identical
      if (sortBy !== '_id' && sortBy !== 'createdAt') {
        sortOptions.createdAt = -1; // Default secondary sort: newest first
      }


      const repoOptions = {
        sort: sortOptions,
        skip: Math.max(0, skip),
        limit: Math.max(1, limitNum),
      };

      const [tasks, totalCount] = await Promise.all([
        taskRepository.findAll(filter, repoOptions),
        taskRepository.countDocuments(filter),
      ]);

      return {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum) || 0,
          hasNext: pageNum * limitNum < totalCount,
          hasPrev: pageNum > 1,
        },
      };
    } catch (error) {
      // Log service layer errors for better debugging if needed
      // console.error("Error in TaskService.getAllTasks:", error);
      throw error; // Propagate to controller/global error handler
    }
  }

  /**
   * Retrieves a single task by its ID.
   * @param {string} id - The ID of the task.
   * @returns {Promise<object>} The task document.
   * @throws {Error} If ID is invalid (400) or task not found (404).
   */
  async getTaskById(id) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        const error = new Error('Invalid task ID format.');
        error.status = 400;
        throw error;
      }
      const task = await taskRepository.findById(id);
      if (!task) {
        const error = new Error('Task not found.');
        error.status = 404;
        throw error;
      }
      return task;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates an existing task, including status transition validation and data normalization.
   * @param {string} id - The ID of the task to update.
   * @param {object} updateData - The data to update the task with.
   * @returns {Promise<object>} The updated task document.
   * @throws {Error} For invalid ID, task not found, validation errors, or invalid status transitions.
   */
  async updateTask(id, updateData) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        const error = new Error('Invalid task ID format.');
        error.status = 400;
        throw error;
      }

      const currentTask = await taskRepository.findById(id);
      if (!currentTask) {
        const error = new Error('Task not found.');
        error.status = 404;
        throw error;
      }

      // Validate status transitions (also handled by validateStatusTransition middleware, but good for service layer integrity)
      if (updateData.status && updateData.status !== currentTask.status) {
        if (currentTask.status === 'Pending' && updateData.status === 'Completed') {
          const error = new Error('Invalid status transition: Cannot change status directly from Pending to Completed.');
          error.status = 400;
          error.details = [{ field: 'status', message: error.message, currentValue: currentTask.status, attemptedValue: updateData.status }];
          throw error;
        }
        if (currentTask.status === 'Completed' && updateData.status === 'Pending') {
          const error = new Error('Invalid status transition: Cannot change status from Completed back to Pending.');
          error.status = 400;
          error.details = [{ field: 'status', message: error.message, currentValue: currentTask.status, attemptedValue: updateData.status }];
          throw error;
        }
      }

      // Normalize tags if provided for update
      if (updateData.tags && Array.isArray(updateData.tags)) {
        updateData.tags = updateData.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter((tag) => tag.length > 0);
        updateData.tags = [...new Set(updateData.tags)];
      } else if (updateData.tags === null || (Array.isArray(updateData.tags) && updateData.tags.length === 0)) {
        updateData.tags = []; // Allow clearing tags by passing null or empty array
      }


      // Validate due date if being updated
      if (updateData.dueDate && new Date(updateData.dueDate) <= new Date()) {
        const error = new Error('Due date must be a future date.');
        error.status = 400;
        error.details = [{ field: 'dueDate', message: error.message, value: updateData.dueDate }];
        throw error;
      }

      // Remove undefined fields from updateData to avoid accidentally clearing fields
      // The repository's updateById method will apply these changes to the Mongoose document.
      const sanitizedUpdateData = { ...updateData };
      Object.keys(sanitizedUpdateData).forEach((key) => {
        if (sanitizedUpdateData[key] === undefined) {
          delete sanitizedUpdateData[key];
        }
      });
      
      // The repository's updateById uses findById and save(), triggering pre-save hooks (history).
      const updatedTask = await taskRepository.updateById(id, sanitizedUpdateData);
      if (!updatedTask) { // Should not happen if currentTask was found, but as a safeguard
          const error = new Error('Task update failed unexpectedly after retrieval.');
          error.status = 500; // Internal server error
          throw error;
      }
      return updatedTask;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const serviceError = new Error('Task update validation failed.');
        serviceError.status = 400;
        serviceError.details = Object.values(error.errors).map((e) => ({
          field: e.path,
          message: e.message,
          value: e.value,
        }));
        throw serviceError;
      }
      throw error;
    }
  }

  /**
   * Deletes a task by its ID.
   * @param {string} id - The ID of the task to delete.
   * @returns {Promise<object>} The deleted task document (or confirmation).
   * @throws {Error} If ID is invalid or task not found.
   */
  async deleteTask(id) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        const error = new Error('Invalid task ID format.');
        error.status = 400;
        throw error;
      }
      const deletedTask = await taskRepository.deleteById(id);
      if (!deletedTask) {
        const error = new Error('Task not found.');
        error.status = 404;
        throw error;
      }
      return deletedTask; // Or simply return a success confirmation
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves the change history for a specific task.
   * @param {string} id - The ID of the task.
   * @returns {Promise<{taskId: string, taskTitle: string, history: object[]}>} Task history details.
   * @throws {Error} If ID is invalid or task not found.
   */
  async getTaskHistory(id) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        const error = new Error('Invalid task ID format.');
        error.status = 400;
        throw error;
      }
      const task = await taskRepository.findById(id); // findById returns full Mongoose doc with history
      if (!task) {
        const error = new Error('Task not found.');
        error.status = 404;
        throw error;
      }
      return {
        taskId: task._id,
        taskTitle: task.title,
        history: task.history.sort((a, b) => b.timestamp - a.timestamp), // Sort newest first
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves aggregated statistics about all tasks.
   * @returns {Promise<object>} An object containing various task statistics.
   */
  async getTaskStats() {
    try {
      const statsArray = await taskRepository.getStatistics();
      // getStatistics returns an array, usually with one element for global stats
      const result = statsArray[0] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
      };
      delete result._id; // Remove the MongoDB grouping _id if present
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default new TaskService();
