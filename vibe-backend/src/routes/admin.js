/**
 * Admin Routes - Dashboard and admin operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const AdminController = require('../controllers/AdminController');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/auctions', AdminController.getActiveAuctions);
router.get('/dashboard/users', AdminController.getUserManagement);
router.get('/dashboard/fraud', AdminController.getFraudLogs);
router.get('/dashboard/performance', AdminController.getPerformanceMetrics);
router.get('/dashboard/logs', AdminController.getSystemLogs);

// Statistics
router.get('/stats/sellers', AdminController.getSellerStats);
router.get('/stats/buyers', AdminController.getBuyerStats);

// System
router.get('/system/config', AdminController.getSystemConfig);

// User Actions
router.post('/users/:userId/block', AdminController.blockUser);
router.post('/users/:userId/unblock', AdminController.unblockUser);
router.delete('/users/:userId', AdminController.deleteUser);

// Product Actions
router.get('/sellers/:sellerId/products', AdminController.getSellerProducts);
router.delete('/products/:auctionId', AdminController.deleteProduct);

module.exports = router;
