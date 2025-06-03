/**
 * Express middleware for logging HTTP requests and responses with timing and IP information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const timestamp = new Date().toISOString();

  /**
   * Extracts real client IP from various proxy headers
   */
  const getRealIP = (req) => {
    return (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'
    );
  };

  const realIP = getRealIP(req);
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = realIP === '::1' || realIP === '127.0.0.1';

  const ipDisplay = isDevelopment && isLocalhost ? 'localhost' : realIP;

  console.log(
    `\x1b[44m\x1b[37m[${timestamp}] INCOMING REQUEST: ${method} ${originalUrl} - IP: ${ipDisplay} - ID: ${req.id}\x1b[0m`
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const responseTimestamp = new Date().toISOString();

    const statusColor =
      statusCode >= 500
        ? '\x1b[41m\x1b[37m'
        : statusCode >= 400
        ? '\x1b[43m\x1b[30m'
        : statusCode >= 300
        ? '\x1b[46m\x1b[30m'
        : '\x1b[42m\x1b[30m';

    console.log(
      `${statusColor}[${responseTimestamp}] RESPONSE SENT: ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms - IP: ${ipDisplay} - ID: ${req.id}\x1b[0m`
    );
  });

  next();
};

export default logger;
