/**
 * Auction Routes - Complete Implementation
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const AuctionController = require('../controllers/AuctionController');

// Public Routes
router.get('/', AuctionController.getAuctions);
router.get('/categories', AuctionController.getCategories);
router.get('/stats', AuctionController.getAuctionStats);
router.get('/seller/:sellerId', AuctionController.getSellerAuctions);
router.get('/:id', AuctionController.getAuctionDetail);
router.get('/:id/recommended-bid', AuctionController.getRecommendedBid);

// Protected Routes (require authentication)
router.post('/', authenticate, AuctionController.createAuction);
router.put('/:id', authenticate, AuctionController.updateAuction);
router.delete('/:id', authenticate, AuctionController.deleteAuction);
router.post('/:id/like', authenticate, AuctionController.toggleLike);

// Interaction Routes
router.get('/:id/bids', AuctionController.getAuctionBids);
router.post('/:id/subscribe', AuctionController.subscribeAuction);
router.post('/:id/finalize', authenticate, AuctionController.finalizeAuction);

module.exports = router;
