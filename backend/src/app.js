/**
 * Main Express application setup for the Task Management API.
 * Configures middleware, security, logging, error handling, and graceful shutdown.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import apiRoutes from './api/index.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import { rateLimiter } from './middlewares/security.js';

dotenv.config();

/**
 * Validates required environment variables on startup
 */
const requiredEnvVars = ['MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: NODE_ENV === 'production',
  })
);

const corsOptions = {
  origin: NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') || [] : true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(rateLimiter);

app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  })
);

/**
 * Request timeout middleware with 30-second timeout
 */
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
        timestamp: new Date().toISOString(),
      });
    }
  }, 30000);

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  next();
});

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
 * Request ID middleware - assigns unique ID to each request for tracing
 */
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use(logger);

/**
 * Initialize database connection with error handling
 */
const initializeDatabase = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

initializeDatabase();

app.use('/api', apiRoutes);

/**
 * Health check endpoint with system information
 */
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Task Management API Server is running',
    version: process.env.API_VERSION || '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    versions: {
      current: 'v1',
      supported: ['v1'],
    },
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
  };

  res.status(200).json(healthCheck);
});

/**
 * 404 handler for unmatched routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

/**
 * Enhanced server startup with logging
 */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${NODE_ENV}`);
  console.log('🔒 Security headers enabled');
  console.log('⚡ Compression enabled');
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

/**
 * Graceful shutdown handler for clean application termination
 * @param {string} signal - The signal that triggered the shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);

  const forceShutdownTimeout = setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ HTTP server closed');
          resolve();
        }
      });
    });

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }

    clearTimeout(forceShutdownTimeout);
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
