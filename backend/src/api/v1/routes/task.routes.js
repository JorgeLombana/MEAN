import express from 'express';
import taskController from '../controllers/task.controller.js';
import { 
  validateTask, 
  validateTaskUpdate, 
  validateId, 
  validateTaskQuery,
  validateStatusTransition // Middleware for specific business rule validation on update
} from '../../../middlewares/validation.js';
import { createTaskLimiter } from '../../../middlewares/security.js';

const router = express.Router();

/**
 * Defines routes for task management under the /api/v1/tasks endpoint.
 * Includes CRUD operations, statistics, and history retrieval,
 * with appropriate validation and security middleware.
 */

// POST /api/v1/tasks - Create a new task
router.post('/', createTaskLimiter, validateTask, taskController.createTask);

// GET /api/v1/tasks - Retrieve all tasks with filtering, sorting, pagination
router.get('/', validateTaskQuery, taskController.getAllTasks);

// GET /api/v1/tasks/stats - Retrieve task statistics
router.get('/stats', taskController.getTaskStats);

// GET /api/v1/tasks/:id - Retrieve a specific task by ID
router.get('/:id', validateId, taskController.getTaskById);

// GET /api/v1/tasks/:id/history - Retrieve history for a specific task
router.get('/:id/history', validateId, taskController.getTaskHistory);

// PUT /api/v1/tasks/:id - Update an existing task
router.put('/:id', validateId, validateTaskUpdate, validateStatusTransition, taskController.updateTask);

// DELETE /api/v1/tasks/:id - Delete a specific task
router.delete('/:id', validateId, taskController.deleteTask);

export default router;
