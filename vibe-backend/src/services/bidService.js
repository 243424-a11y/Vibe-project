/**
 * Bid Service - Business logic for bidding operations
 */

const BidModel = require('../models/Bid');
const AuctionModel = require('../models/Auction');

class BidService {
  /**
   * Process auto-bidding
   * Automatically place bids up to the user's limit
   */
  static async processAutoBids(auctionId, currentBidAmount) {
    try {
      const query = `
        SELECT b.*, u.user_id 
        FROM Bids b
        JOIN Users u ON b.user_id = u.user_id
        WHERE b.auction_id = ? 
        AND b.auto_bid_limit IS NOT NULL
        AND b.auto_bid_limit > ?
        AND b.user_id != (SELECT highest_bidder_id FROM Auctions WHERE auction_id = ?)
        ORDER BY b.auto_bid_limit DESC
      `;

      const connection = await require('../config/database').pool.getConnection();
      const [autoBids] = await connection.execute(query, [auctionId, currentBidAmount, auctionId]);
      connection.release();

      if (autoBids.length > 0) {
        const autoBid = autoBids[0];
        const minimumIncrement = 1; // Minimum bid increment
        const nextBidAmount = Math.min(
          autoBid.auto_bid_limit,
          currentBidAmount + minimumIncrement
        );

        // Place auto-bid
        const bidId = await BidModel.placeBid({
          auctionId: auctionId,
          userId: autoBid.user_id,
          bidAmount: nextBidAmount,
          autoBidLimit: autoBid.auto_bid_limit,
          fraudScore: 0 // Auto-bids are from verified accounts
        });

        // Broadcast the new bid
        if (global.broadcastBid) {
          global.broadcastBid(auctionId, {
            bid_id: bidId,
            user_id: autoBid.user_id,
            bid_amount: nextBidAmount,
            bid_count: 1,
            username: 'Auto-Bidder'
          });
        }

        return { success: true, bidId, amount: nextBidAmount };
      }

      return { success: false, message: 'No active auto-bids' };
    } catch (error) {
      console.error('Error processing auto-bids:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate minimum bid for an auction
   */
  static calculateMinimumBid(currentPrice, startingPrice) {
    const minimumIncrement = 1;
    return Math.max(startingPrice, currentPrice) + minimumIncrement;
  }

  /**
   * Validate bid amount
   */
  static validateBidAmount(bidAmount, currentPrice, startingPrice, reservePrice = null) {
    const errors = [];

    if (!bidAmount || bidAmount <= 0) {
      errors.push('Bid amount must be a positive number');
    }

    const minimumBid = this.calculateMinimumBid(currentPrice, startingPrice);
    if (bidAmount < minimumBid) {
      errors.push(`Bid amount must be at least ${minimumBid}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get bid statistics for an auction
   */
  static async getAuctionBidStats(auctionId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bids,
          COUNT(DISTINCT user_id) as unique_bidders,
          MAX(bid_amount) as highest_bid,
          MIN(bid_amount) as lowest_bid,
          AVG(bid_amount) as avg_bid,
          MAX(created_at) as last_bid_time
        FROM Bids
        WHERE auction_id = ?
      `;

      const connection = await require('../config/database').pool.getConnection();
      const [results] = await connection.execute(query, [auctionId]);
      connection.release();

      return results[0] || {
        total_bids: 0,
        unique_bidders: 0,
        highest_bid: null,
        lowest_bid: null,
        avg_bid: null,
        last_bid_time: null
      };
    } catch (error) {
      console.error('Error fetching bid stats:', error);
      throw error;
    }
  }

  /**
   * Get user bidding activity
   */
  static async getUserBiddingStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bids,
          COUNT(DISTINCT auction_id) as auctions_participated,
          SUM(CASE WHEN a.highest_bidder_id = b.user_id THEN 1 ELSE 0 END) as auctions_winning,
          AVG(b.bid_amount) as avg_bid_amount,
          MAX(b.created_at) as last_bid_time
        FROM Bids b
        LEFT JOIN Auctions a ON b.auction_id = a.auction_id
        WHERE b.user_id = ?
      `;

      const connection = await require('../config/database').pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();

      return results[0] || {
        total_bids: 0,
        auctions_participated: 0,
        auctions_winning: 0,
        avg_bid_amount: null,
        last_bid_time: null
      };
    } catch (error) {
      console.error('Error fetching user bidding stats:', error);
      throw error;
    }
  }

  /**
   * Get recommended bid for an auction
   */
  static async getRecommendedBid(auctionId) {
    try {
      const auction = await AuctionModel.getAuctionById(auctionId);
      if (!auction) throw new Error('Auction not found');

      const currentPrice = auction.current_price || auction.starting_price;
      const bidCount = auction.bid_count || 0;

      // Logic: 5% increase if many bids, 10% if few, or minimum increment if none
      let recommendation;
      if (bidCount === 0) {
        recommendation = currentPrice;
      } else if (bidCount > 10) {
        recommendation = currentPrice * 1.05;
      } else {
        recommendation = currentPrice * 1.10;
      }

      // Round to nearest integer for better UX
      return Math.ceil(recommendation);
    } catch (error) {
      console.error('Error calculating recommended bid:', error);
      throw error;
    }
  }
}

module.exports = BidService;
