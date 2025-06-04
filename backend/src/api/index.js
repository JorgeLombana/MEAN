import express from 'express';
import v1Routes from './v1/index.js';

const router = express.Router();

// Mount v1 routes under /v1
router.use('/v1', v1Routes);

// Redirect the base /api route to the current primary version (v1) for convenience.
// This makes /api/tasks and /api/v1/tasks equivalent.
router.use('/', v1Routes);

/**
 * Provides general information about the API.
 * @route GET /info
 * @group API Information - General API details
 * @returns {object} 200 - An object containing API versioning and endpoint information.
 * @returns {Error}  default - Unexpected error
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Management API',
    versions: {
      current: 'v1',
      supported: ['v1'], // List all supported versions
      deprecated: [],
    },
    endpoints: {
      v1: '/api/v1',
      latest: '/api/v1', // Base /api also points to v1 as per redirection above
    },
    documentation: '/api/docs', // Placeholder for future documentation URL
    timestamp: new Date().toISOString(),
    requestId: req.id, // Include request ID for traceability
  });
});

export default router;
