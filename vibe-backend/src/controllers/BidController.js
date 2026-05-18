/**
 * Bid Controller - Business logic for bidding operations
 */

const BidModel = require('../models/Bid');
const AuctionModel = require('../models/Auction');
const BidService = require('../services/bidService');
const UserModel = require('../models/User');
const axios = require('axios');
const { pool } = require('../config/database');

class BidController {
  /**
   * Place a new bid
   */
  static async placeBid(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { auctionId, bidAmount, autoBidLimit } = req.body;

      // Validation
      if (!auctionId || !bidAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: auctionId, bidAmount'
        });
      }

      if (isNaN(bidAmount) || bidAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Bid amount must be a positive number'
        });
      }

      // Get auction details
      const auction = await AuctionModel.getAuctionById(parseInt(auctionId));
      if (!auction) {
        return res.status(404).json({
          success: false,
          error: 'Auction not found'
        });
      }

      // Constraint: Same user can only bid a single time on any one product
      const [existingUserBids] = await pool.execute(
        'SELECT bid_id FROM Bids WHERE auction_id = ? AND user_id = ?',
        [parseInt(auctionId), userId]
      );
      if (existingUserBids && existingUserBids.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'You have already placed a bid on this product. Each buyer can only bid a single time.'
        });
      }

      // Constraint: Current highest bidder cannot bid again
      if (auction.highest_bidder_id === userId) {
        return res.status(400).json({
          success: false,
          error: 'You are already the highest bidder'
        });
      }

      // Validate bid amount
      const validation = BidService.validateBidAmount(
        parseFloat(bidAmount),
        parseFloat(auction.current_price) || 0,
        parseFloat(auction.starting_price) || 0,
        auction.reserve_price ? parseFloat(auction.reserve_price) : null
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0] || 'Invalid bid amount',
          details: validation.errors
        });
      }

      // Check fraud score
      let fraudScore = 0;
      try {
        const fraudResponse = await axios.post(
          'http://localhost:5000/api/score-bid',
          {
            user_id: userId,
            auction_id: auctionId,
            bid_amount: bidAmount
          },
          { timeout: 3000 }
        );
        fraudScore = fraudResponse.data.fraud_score || 0;

        // Block if fraud score too high
        if (fraudScore > 0.8) {
          // Create fraud log
          await BidModel.createFraudLog({
            bidId: null,
            userId: userId,
            auctionId: auctionId,
            fraudScore: fraudScore,
            riskLevel: 'high',
            flaggedReason: 'Bid blocked due to high fraud score',
            modelVersion: '1.0'
          });

          return res.status(403).json({
            success: false,
            error: 'Bid blocked due to suspicious activity',
            fraudScore
          });
        }
      } catch (error) {
        console.error('Fraud detection service offline, using simulation:', error.message);
        fraudScore = Math.random() * 0.3; // Low fraud score for simulation
      }

      // Place bid
      const bidId = await BidModel.placeBid({
        auctionId: parseInt(auctionId),
        userId,
        bidAmount: parseFloat(bidAmount),
        autoBidLimit: autoBidLimit ? parseFloat(autoBidLimit) : null,
        fraudScore
      });

      const connection = await pool.getConnection();
      try {
        // Broadcast bid to auction room
        if (global.broadcastBid) {
          const [user] = await connection.execute('SELECT username FROM Users WHERE user_id = ?', [userId]);
          global.broadcastBid(auctionId, {
            bid_id: bidId,
            user_id: userId,
            bid_amount: parseFloat(bidAmount),
            bid_count: (auction.bid_count || 0) + 1,
            username: user[0]?.username || 'Anonymous',
            created_at: new Date().toISOString()
          });
        }
      } finally {
        connection.release();
      }

      // Notify previous highest bidder if applicable
      if (auction.highest_bidder_id && auction.highest_bidder_id !== userId) {
        await UserModel.createNotification({
          userId: auction.highest_bidder_id,
          type: 'outbid',
          title: 'You have been outbid',
          message: `You have been outbid on ${auction.title}. New bid: ${bidAmount}`,
          relatedAuctionId: auctionId,
          relatedUserId: userId
        });

        // Broadcast outbid notification
        if (global.broadcastOutbid) {
          global.broadcastOutbid(auction.highest_bidder_id, auction);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Bid placed successfully',
        data: { bid_id: bidId, fraud_score: fraudScore }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bid history for an auction
   */
  static async getBidHistory(req, res, next) {
    try {
      const { auctionId } = req.params;
      const { limit = 50 } = req.query;

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const bids = await BidModel.getBidHistory(parseInt(auctionId), parseInt(limit));

      res.json({
        success: true,
        data: bids
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's bids
   */
  static async getUserBids(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { status, page = 1, limit = 20 } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const bids = await BidModel.getUserBids(userId, {
        status: status || null,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: bids,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get highest bid
   */
  static async getHighestBid(req, res, next) {
    try {
      const { auctionId } = req.params;

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const bid = await BidModel.getHighestBid(parseInt(auctionId));

      res.json({
        success: true,
        data: bid
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update auto-bid limit
   */
  static async updateAutoBid(req, res, next) {
    try {
      const { bidId } = req.params;
      const { newLimit } = req.body;

      if (!bidId || !newLimit) {
        return res.status(400).json({
          success: false,
          error: 'Missing bidId or newLimit'
        });
      }

      const updated = await BidModel.updateAutoBidLimit(parseInt(bidId), parseFloat(newLimit));

      if (!updated) {
        return res.status(400).json({
          success: false,
          error: 'Failed to update auto-bid limit'
        });
      }

      res.json({
        success: true,
        message: 'Auto-bid limit updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's bids
   */
  static async getUserBids(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { pool } = require('../config/database');
      const connection = await pool.getConnection();

      const [bids] = await connection.execute(`
        SELECT b.*, a.title, a.status as auction_status, a.current_price, a.end_time
        FROM Bids b
        LEFT JOIN Auctions a ON b.auction_id = a.auction_id
        WHERE b.user_id = ?
        ORDER BY b.bid_time DESC
        LIMIT 50
      `, [userId]);

      connection.release();

      res.json({
        success: true,
        data: bids
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BidController;
