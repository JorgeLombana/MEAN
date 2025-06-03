import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for all API endpoints
 * Limits each IP to 100 requests per 15 minutes
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Specific rate limiter for task creation endpoint
 * Limits each IP to 20 task creations per 15 minutes
 */
export const createTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many tasks created from this IP, please try again later.',
  },
});
