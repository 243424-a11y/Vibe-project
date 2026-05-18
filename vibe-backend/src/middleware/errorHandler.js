/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

const logger = require('winston');

function errorHandler(err, req, res, next) {
  // Log error to console for immediate visibility
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Log error to winston
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.user_id,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  // Handle specific errors
  if (err.message === 'Invalid email or password' || err.message === 'Unauthorized') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.details?.map(d => d.message).join(', ') || 'Validation failed';
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Unauthorized access';
  }

  if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access forbidden';
  }

  if (err.message === 'Token expired') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token has expired, please login again';
  }

  // Don't expose internal error details
  const response = {
    success: false,
    error: message,
    code: errorCode,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };

  // Add request ID for debugging
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
