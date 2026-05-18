/**
 * Fraud Routes - Admin detection and monitoring
 */

const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const FraudController = require('../controllers/FraudController');

// Fraud Logs
router.get('/logs', authorize(['admin']), FraudController.getFraudLogs);

// Fraud Statistics
router.get('/stats', authorize(['admin']), FraudController.getFraudStats);

// User Fraud History
router.get('/user/:userId/history', authorize(['admin']), FraudController.getUserFraudHistory);

// Check Bid Fraud
router.get('/bid/:bidId', authorize(['admin']), FraudController.checkBidFraud);

// High Risk Users
router.get('/risk/high-risk-users', authorize(['admin']), FraudController.getHighRiskUsers);

// Block/Unblock Users
router.post('/user/:userId/block', authorize(['admin']), FraudController.blockUser);
router.post('/user/:userId/unblock', authorize(['admin']), FraudController.unblockUser);

// Generate Report
router.get('/report/generate', authorize(['admin']), FraudController.generateReport);

module.exports = router;
