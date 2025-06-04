import taskService from '../services/task.service.js';

/**
 * Controller for handling task-related API requests.
 * It uses TaskService to interact with the business logic layer.
 */
class TaskController {
  /**
   * Creates a new task.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: task,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      // The centralized error handler will format the response.
      // Specific handling for service-level validation errors can be done here if needed,
      // but generally, the service should throw errors that the global handler can interpret.
      next(error);
    }
  }

  /**
   * Retrieves all tasks, supporting filtering, sorting, and pagination.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async getAllTasks(req, res, next) {
    try {
      const result = await taskService.getAllTasks(req.query);
      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully.',
        data: result.tasks,
        pagination: result.pagination,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific task by its ID.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      // Service layer throws 404 if not found, which errorHandler handles.
      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully.',
        data: task,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing task by its ID.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      // Service layer throws 404 if not found.
      res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: task,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a task by its ID.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.params.id);
      // Service layer throws 404 if not found.
      res.status(204).send(); // No content to send back
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves the history of changes for a specific task.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async getTaskHistory(req, res, next) {
    try {
      const historyData = await taskService.getTaskHistory(req.params.id);
      // Service layer throws 404 if task not found.
      res.status(200).json({
        success: true,
        message: 'Task history retrieved successfully.',
        data: historyData,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves aggregated statistics about tasks.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   */
  async getTaskStats(req, res, next) {
    try {
      const stats = await taskService.getTaskStats();
      res.status(200).json({
        success: true,
        message: 'Task statistics retrieved successfully.',
        data: stats,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
