/**
 * Bid Model - Database operations for bids
 */

const { pool } = require('../config/database');

class BidModel {
  /**
   * Place a new bid
   */
  static async placeBid(bidData) {
    const {
      auctionId,
      userId,
      bidAmount,
      autoBidLimit = null,
      fraudScore = 0
    } = bidData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock auction row for update
      const [auctionResult] = await connection.execute(
        'SELECT * FROM Auctions WHERE auction_id = ? FOR UPDATE',
        [auctionId]
      );

      if (auctionResult.length === 0) {
        throw new Error('Auction not found');
      }

      const auction = auctionResult[0];

      // Validate auction is active
      if (auction.status !== 'active') {
        throw new Error('Auction is not active');
      }

      // Validate bid amount
      const minimumBid = Math.max(auction.current_price, auction.starting_price) + 1;
      if (bidAmount < minimumBid) {
        throw new Error(`Minimum bid must be at least ${minimumBid}`);
      }

      // Check if auction has ended
      if (new Date(auction.end_time) <= new Date()) {
        throw new Error('Auction has ended');
      }

      // Insert bid
      const [bidResult] = await connection.execute(
        `INSERT INTO Bids (auction_id, user_id, bid_amount, fraud_score, bid_time)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [auctionId, userId, bidAmount, fraudScore]
      );

      // Update auction
      await connection.execute(
        `UPDATE Auctions 
         SET highest_bidder_id = ?, current_price = ?, bid_count = bid_count + 1, updated_at = CURRENT_TIMESTAMP
         WHERE auction_id = ?`,
        [userId, bidAmount, auctionId]
      );

      await connection.commit();
      return bidResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error placing bid: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Get bid history for an auction
   */
  static async getBidHistory(auctionId, limit = 50) {
    const query = `
      SELECT 
        b.*,
        u.username,
        u.seller_rating
      FROM Bids b
      LEFT JOIN Users u ON b.user_id = u.user_id
      WHERE b.auction_id = ?
      ORDER BY b.bid_time DESC
      LIMIT ?
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [auctionId, limit]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching bid history: ${error.message}`);
    }
  }

  /**
   * Get user's bids
   */
  static async getUserBids(userId, filters = {}) {
    const { status = null, limit = 20, offset = 0 } = filters;
    let query = `
      SELECT 
        b.*,
        a.title,
        a.current_price,
        a.end_time,
        a.status as auction_status
      FROM Bids b
      LEFT JOIN Auctions a ON b.auction_id = a.auction_id
      WHERE b.user_id = ?
    `;
    const values = [userId];

    if (status) {
      query += ' AND a.status = ?';
      values.push(status);
    }

    query += ' ORDER BY b.bid_time DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching user bids: ${error.message}`);
    }
  }

  /**
   * Get highest bid for an auction
   */
  static async getHighestBid(auctionId) {
    const query = `
      SELECT * FROM Bids 
      WHERE auction_id = ? 
      ORDER BY bid_amount DESC 
      LIMIT 1
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [auctionId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching highest bid: ${error.message}`);
    }
  }

  /**
   * Get bid count for user
   */
  static async getUserBidCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM Bids WHERE user_id = ?';

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results[0]?.count || 0;
    } catch (error) {
      throw new Error(`Error fetching bid count: ${error.message}`);
    }
  }

  /**
   * Get fraud logs for a bid
   */
  static async getBidFraudStatus(bidId) {
    const query = `
      SELECT * FROM FraudLogs 
      WHERE bid_id = ? 
      ORDER BY detected_at DESC 
      LIMIT 1
      `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [bidId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching fraud status: ${error.message}`);
    }
  }

  /**
   * Create fraud log
   */
  static async createFraudLog(fraudData) {
    const {
      bidId,
      userId,
      auctionId,
      fraudScore,
      riskLevel,
      flaggedReason,
      modelVersion
    } = fraudData;

    // Map risk level to fraud_type enum
    const fraudType = riskLevel === 'high' ? 'suspicious_pattern' : 'rapid_bidding';

    const query = `
      INSERT INTO FraudLogs (bid_id, user_id, auction_id, fraud_type, fraud_confidence, reason, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [
        bidId, userId, auctionId, fraudType, fraudScore, flaggedReason
      ]);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating fraud log: ${error.message}`);
    }
  }

  /**
   * Get user fraud history
   */
  static async getUserFraudHistory(userId) {
    const query = `
      SELECT * FROM FraudLogs 
      WHERE user_id = ? 
      ORDER BY detected_at DESC 
      LIMIT 50
      `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching fraud history: ${error.message}`);
    }
  }

  /**
   * Update bid auto-bid limit
   */
  static async updateAutoBidLimit(bidId, newLimit) {
    const query = 'UPDATE Bids SET auto_bid_limit = ? WHERE bid_id = ?';

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [newLimit, bidId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating auto-bid limit: ${error.message}`);
    }
  }
}

module.exports = BidModel;
