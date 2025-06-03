/**
 * Centralized Express error handling middleware
 * Handles validation, MongoDB, and generic errors with formatted responses
 */

const errorHandler = (err, req, res) => {
  const error = { ...err };
  error.message = err.message;

  console.error(`
╔══════════════════════════════════════════════════════════════
║ ERROR DETAILS
╠══════════════════════════════════════════════════════════════
║ Status: ${err.status || 500}
║ Message: ${err.message}
║ Request ID: ${req.id || 'N/A'}
║ Method: ${req.method || 'N/A'}
║ URL: ${req.originalUrl || 'N/A'}
║ Timestamp: ${new Date().toISOString()}
╚══════════════════════════════════════════════════════════════`);

  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      field: err.path,
      value: err.value,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
      field: field,
      value: err.keyValue[field],
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      requestId: req.id,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
      }),
    });
  }

  if (err.details) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message,
      errors: err.details,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      requestId: req.id,
      timestamp: new Date().toISOString(),
      retryAfter: err.retryAfter || '15 minutes',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  });
};

export default errorHandler;
