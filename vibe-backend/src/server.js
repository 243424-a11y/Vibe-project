/**
 * VIBE Backend - Main Server Entry Point
 * Real-Time Auction Platform
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const cookieParser = require('cookie-parser');

// Import configuration
const config = require('./config/database');
const { redisClient } = require('./config/redis');
const { setupSocketIO } = require('./config/socket');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticate, authorize } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const userRoutes = require('./routes/users');
const fraudRoutes = require('./routes/fraud');
const adminRoutes = require('./routes/admin');

// Import background jobs
const { initializeJobs } = require('./jobs/auctionJobs');

// =====================================================
// Logger Setup
// =====================================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// =====================================================
// Express App Setup
// =====================================================
const app = express();
const server = http.createServer(app);

// Raw HTTP-level interceptor: handle /count before Express middleware
server.on('request', (req, res) => {
  try {
    const url = req.url || '';
    if (url.startsWith('/count')) {
      try {
        logger.info('RAW COUNT probe received', { url, ip: req.socket.remoteAddress, headers: req.headers });
      } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: 0 }));
      return;
    }
  } catch (e) {
    // continue to express for any errors
  }
});

// Immediate unconditional handler for any /count* path to stop auth checks and capture headers
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/count')) {
    try {
      logger.info('COUNT probe received', { path: req.path, ip: req.ip, headers: req.headers });
    } catch (e) {
      // ignore logging errors
    }
    return res.json({ success: true, count: 0 });
  }
  next();
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Short-circuit unauthenticated health probe for root path when no Authorization header
app.use((req, res, next) => {
  if (req.path === '/' && !req.headers['authorization']) {
    return res.json({ success: true, path: '/', count: 0 });
  }
  next();
});

// Compression
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const biddingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many bid requests, please wait before placing another bid.'
});

// app.use(generalLimiter);

// =====================================================
// Logging Middleware
// =====================================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// =====================================================
// Routes
// =====================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'V.I.B.E Backend is running',
    timestamp: new Date().toISOString()
  });
});

// (Legacy) keep /count route for explicit matches (will be shadowed by the early handler)
app.get('/count', (req, res) => {
  res.json({ success: true, count: 0 });
});

// API Version
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    name: 'V.I.B.E - Validated Intelligent Bidding Engine'
  });
});

// Auth Routes (No authentication required)
app.use('/api/auth', authRoutes);

// Protected Routes (Require authentication)
app.use('/api/auctions', auctionRoutes);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/bids', biddingLimiter, bidRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fraud', authenticate, authorize(['admin']), fraudRoutes);
app.use('/api/admin', adminRoutes);

// =====================================================
// Socket.IO Setup
// =====================================================
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6
});

setupSocketIO(io);
global.io = io;

// =====================================================
// Error Handling
// =====================================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Global Error Handler
app.use(errorHandler);

// =====================================================
// Server Startup
// =====================================================
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  // Test database connection (non-blocking)
  try {
    const connection = await config.getConnection();
    connection.release();
    logger.info('✓ Database connected');
  } catch (error) {
    logger.warn('⚠ Database connection failed - running in demo mode');
  }

  // Test Redis connection (non-blocking)
  try {
    await redisClient.ping();
    logger.info('✓ Redis connected');
  } catch (error) {
    logger.warn('⚠ Redis connection failed (will use in-memory cache)');
  }

  // Initialize background jobs
  try {
    initializeJobs();
    logger.info('✓ Background jobs initialized');
  } catch (error) {
    logger.warn('⚠ Background jobs initialization failed:', error.message);
  }

  logger.info(`✓ Server running on port ${PORT}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✓ Socket.IO ready for real-time connections`);
  logger.info('✓ V.I.B.E Backend is fully operational');
});

// =====================================================
// Graceful Shutdown
// =====================================================
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    try {
      await config.end();
      await redisClient.quit();
      logger.info('✓ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.emit('SIGINT');
});

module.exports = { app, server, io };
