import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const SERVER_PORT = process.env.PORT || 5000;
const NODE_ENVIRONMENT = process.env.NODE_ENV || 'development';
const API_VERSION = process.env.API_VERSION || '1.0.0';

// Core middleware configuration
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

/**
 * Health check endpoint for monitoring and load balancers
 * Returns server status, version, and basic metrics
 */
app.get('/health', (req, res) => {
  const healthCheckResponse = {
    success: true,
    message: 'Task Management API Server is running',
    version: API_VERSION,
    environment: NODE_ENVIRONMENT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
  };

  res.status(200).json(healthCheckResponse);
});

/**
 * Global 404 handler for undefined routes
 * Provides consistent error response format
 */
app.use((req, res) => {
  const notFoundResponse = {
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(notFoundResponse);
});

/**
 * Start the HTTP server
 * Log startup information for debugging and monitoring
 */
const httpServer = app.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_PORT}`);
  console.log(`📱 Environment: ${NODE_ENVIRONMENT}`);
  console.log(`📋 API Version: ${API_VERSION}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

/**
 * Graceful shutdown handler for SIGTERM
 * Ensures proper cleanup when container orchestrators stop the service
 */
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Starting graceful shutdown...');
  performGracefulShutdown();
});

/**
 * Graceful shutdown handler for SIGINT (Ctrl+C)
 * Ensures proper cleanup during development
 */
process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Starting graceful shutdown...');
  performGracefulShutdown();
});

/**
 * Centralized graceful shutdown logic
 * Closes server connections and exits cleanly
 */
function performGracefulShutdown() {
  httpServer.close((error) => {
    if (error) {
      console.error('❌ Error during server shutdown:', error);
      process.exit(1);
    }

    console.log('✅ HTTP server closed successfully');
    console.log('👋 Application shutdown complete');
    process.exit(0);
  });
}

export default app;
