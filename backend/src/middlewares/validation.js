import { body, param, query, validationResult } from 'express-validator';

// Validation result handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

export const validateTask = [
  body('title')
    .notEmpty()
    .withMessage('Title is required and cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .trim(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed')
    .custom((value) => {
      // Prevent creating tasks with Completed status
      if (value === 'Completed') {
        throw new Error('Cannot create a task with Completed status. Tasks must be created as Pending or In Progress');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required and cannot be empty')
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date format')
    .custom((value) => {
      const dueDate = new Date(value);
      const now = new Date();
      if (dueDate <= now) {
        throw new Error('Due date cannot be in the past and must be a future date');
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 0) {
        // Check for empty or invalid tags
        if (tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
          throw new Error('All tags must be non-empty strings');
        }
        // Check for unique values (case-insensitive)
        const normalizedTags = tags.map(tag => tag.trim().toLowerCase());
        if (normalizedTags.length !== new Set(normalizedTags).size) {
          throw new Error('Tags must contain unique values');
        }
      }
      return true;
    }),
  handleValidationErrors
];

export const validateTaskUpdate = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (value) {
        const dueDate = new Date(value);
        const now = new Date();
        if (dueDate <= now) {
          throw new Error('Due date must be in the future');
        }
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length !== new Set(tags).size) {
        throw new Error('Tags must contain unique values');
      }
      if (tags && tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
        throw new Error('All tags must be non-empty strings');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  handleValidationErrors
];

export const validateTaskQuery = [
  query('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.query.startDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags query parameter must be a string')
    .custom((value) => {
      const tags = value.split(',');
      if (tags.some(tag => tag.trim().length === 0 && value.length > 0)) {
        throw new Error('Tags in the query list cannot be empty.');
      }
      return true;
    }),
  handleValidationErrors
];

// Add a new validation specifically for status transitions
export const validateStatusTransition = async (req, res, next) => {
  try {
    if (req.body.status && req.params.id) {
      const Task = (await import('../models/taskModel.js')).default;
      const currentTask = await Task.findById(req.params.id);
      
      if (currentTask && req.body.status !== currentTask.status) {
        // Check invalid transitions - updated to use new enum values
        if (currentTask.status === 'Pending' && req.body.status === 'Completed') {
          return res.status(400).json({
            success: false,
            message: 'Invalid status transition',
            errors: [{
              field: 'status',
              message: 'Cannot change status directly from Pending to Completed. Task must go through In Progress first.',
              currentValue: currentTask.status,
              attemptedValue: req.body.status
            }]
          });
        }
        
        if (currentTask.status === 'Completed' && req.body.status === 'Pending') {
          return res.status(400).json({
            success: false,
            message: 'Invalid status transition',
            errors: [{
              field: 'status',
              message: 'Cannot change status from Completed back to Pending.',
              currentValue: currentTask.status,
              attemptedValue: req.body.status
            }]
          });
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
