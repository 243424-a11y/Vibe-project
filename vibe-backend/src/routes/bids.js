/**
 * Bid Routes - Phase 2B Implementation
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const BidController = require('../controllers/BidController');

// Protected Routes
router.post('/', authenticate, BidController.placeBid);
router.get('/user/my-bids', authenticate, BidController.getUserBids);

// Public Routes
router.get('/:auctionId/history', BidController.getBidHistory);
router.get('/:auctionId/highest', BidController.getHighestBid);

// Auto-bid Routes
router.put('/:bidId/auto-bid', authenticate, BidController.updateAutoBid);

module.exports = router;
