import express from 'express';
import taskRoutes from './routes/task.routes.js';

const router = express.Router();

/**
 * Health check endpoint specific for API v1.
 * Provides status and basic information about the v1 API.
 * @route GET /health
 * @group Health - API v1 Health Status
 * @returns {object} 200 - An object confirming API v1 is running and system details.
 * @returns {Error}  default - Unexpected error
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: 'API v1 is running smoothly',
    version: '1.0.0', // Consider making this dynamic from package.json or env
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      usedMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      totalMB: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
    requestId: req.id, // Include request ID for traceability
  };

  res.status(200).json(healthCheck);
});

// Mount task-specific routes under /tasks
router.use('/tasks', taskRoutes);

export default router;
