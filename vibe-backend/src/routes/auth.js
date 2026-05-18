/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const AuthService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { generateToken } = require('../config/jwt');

const EmailService = require('../services/emailService');

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().regex(/^[a-zA-Z0-9_-]+$/).min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('buyer', 'seller', 'admin').default('buyer')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('buyer', 'seller', 'admin').optional()
});

/**
 * POST /api/auth/subscribe
 * Newsletter subscription
 */
router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    await EmailService.sendNewsletterSignup(email);
    res.json({
      success: true,
      message: 'Successfully subscribed to V.I.B.E newsletter!'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const user = await AuthService.registerUser(username, email, password, role);

    res.status(201).json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: user.token
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await AuthService.loginUser(email, password, role, ipAddress, userAgent);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: user.token
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/google
 * Google Sign-In with domain verification (Air University only)
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google credential is required' 
      });
    }

    // Verify the Google ID token using google-auth-library
    const { OAuth2Client } = require('google-auth-library');
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Google token' 
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Google token' 
      });
    }

    // Restrict to allowed email domains if configured
    const allowedDomainEnv = process.env.ALLOWED_EMAIL_DOMAIN || '';
    const allowedDomains = allowedDomainEnv
      .split(',')
      .map(domain => domain.trim().toLowerCase())
      .filter(Boolean);
    const emailDomain = payload.email.split('@')[1]?.toLowerCase();

    if (allowedDomains.length > 0 && !allowedDomains.includes('*')) {
      if (!emailDomain || !allowedDomains.includes(emailDomain)) {
        return res.status(403).json({ 
          success: false, 
          error: allowedDomains.length === 1
            ? `Access restricted to ${allowedDomains[0]} users only. Please use your @${allowedDomains[0]} email.`
            : `Access restricted to authorized Google accounts only. Please sign in with an approved email.`
        });
      }
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await AuthService.googleLogin(
      payload.email,
      payload.name || payload.email.split('@')[0],
      role || 'buyer',
      ipAddress,
      userAgent
    );

    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: user.token
      },
      message: 'Google login successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify the refresh token before generating new JWT
    const { verifyToken } = require('../config/jwt');
    const decoded = verifyToken(refreshToken);

    if (!decoded || !decoded.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'UNAUTHORIZED'
      });
    }

    const newToken = generateToken({ user_id: decoded.user_id });

    res.json({
      success: true,
      data: {
        token: newToken
      },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await AuthService.getUserById(req.user.user_id);

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
