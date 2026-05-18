/**
 * Authentication & Authorization Middleware
 */

const { verifyToken } = require('../config/jwt');
const db = require('../config/database');

/**
 * Authenticate JWT token
 */
async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const users = await db.query(
      'SELECT user_id, username, email, role, is_blocked, is_verified FROM Users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'UNAUTHORIZED'
      });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid token',
      code: 'UNAUTHORIZED'
    });
  }
}

/**
 * Authorize by role
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required_role: allowedRoles
      });
    }

    next();
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      const decoded = verifyToken(token);
      const users = await db.query(
        'SELECT user_id, username, email, role FROM Users WHERE user_id = ?',
        [decoded.user_id]
      );
      if (users.length) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
