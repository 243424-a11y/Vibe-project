/**
 * Auction Model - Database operations for auctions
 */

const { pool } = require('../config/database');

class AuctionModel {
  /**
   * Get all auctions with filtering and pagination
   */
  static async getAllAuctions(filters = {}) {
    const {
      status = 'active',
      category = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
      minPrice = null,
      maxPrice = null,
      sellerId = null
    } = filters;

    let query = 'SELECT * FROM Auctions WHERE 1=1';
    const values = [];

    if (status && status !== 'all') {
      if (status.includes(',')) {
        const statuses = status.split(',');
        query += ` AND status IN (${statuses.map(() => '?').join(',')})`;
        values.push(...statuses);
      } else {
        query += ' AND status = ?';
        values.push(status);
      }
    }

    if (category) {
      query += ' AND category = ?';
      values.push(category);
    }

    if (minPrice !== null) {
      query += ' AND current_price >= ?';
      values.push(minPrice);
    }

    if (maxPrice !== null) {
      query += ' AND current_price <= ?';
      values.push(maxPrice);
    }

    if (sellerId !== null) {
      query += ' AND seller_id = ?';
      values.push(sellerId);
    }

    // Valid sort columns
    const validSortColumns = ['created_at', 'current_price', 'end_time', 'views_count', 'bid_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${sortColumn} ${order} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching auctions: ${error.message}`);
    }
  }

  /**
   * Toggle like status for an auction
   */
  static async toggleLike(auctionId, userId) {
    try {
      const connection = await pool.getConnection();
      const [existing] = await connection.execute(
        'SELECT * FROM Likes WHERE auction_id = ? AND user_id = ?', 
        [auctionId, userId]
      );
      if (existing.length > 0) {
        await connection.execute('DELETE FROM Likes WHERE auction_id = ? AND user_id = ?', [auctionId, userId]);
        connection.release();
        return { liked: false };
      } else {
        await connection.execute('INSERT INTO Likes (auction_id, user_id) VALUES (?, ?)', [auctionId, userId]);
        connection.release();
        return { liked: true };
      }
    } catch (error) {
      throw new Error(`Error toggling like: ${error.message}`);
    }
  }

  /**
   * Get total likes for an auction
   */
  static async getAuctionLikes(auctionId) {
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(
        'SELECT COUNT(*) as count FROM Likes WHERE auction_id = ?', 
        [auctionId]
      );
      connection.release();
      return results[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if user liked an auction
   */
  static async checkIfLiked(auctionId, userId) {
    if (!userId) return false;
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(
        'SELECT * FROM Likes WHERE auction_id = ? AND user_id = ?', 
        [auctionId, userId]
      );
      connection.release();
      return results.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get auction by ID with detailed information
   */
  static async getAuctionById(auctionId) {
    const query = `
      SELECT 
        a.*,
        u.username as seller_name,
        u.seller_rating,
        u.total_auctions_sold,
        hb.username as highest_bidder_name
      FROM Auctions a
      LEFT JOIN Users u ON a.seller_id = u.user_id
      LEFT JOIN Users hb ON a.highest_bidder_id = hb.user_id
      WHERE a.auction_id = ?
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [auctionId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching auction: ${error.message}`);
    }
  }

  /**
   * Create new auction
   */
  static async createAuction(auctionData) {
    const {
      sellerId,
      title,
      description,
      category,
      primaryImageUrl,
      additionalImages,
      startingPrice,
      reservePrice,
      startTime,
      endTime
    } = auctionData;

    const query = `
      INSERT INTO Auctions (
        seller_id, title, description, category, primary_image_url,
        additional_images, starting_price, current_price, reserve_price,
        start_time, end_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    const values = [
      sellerId,
      title,
      description,
      category,
      primaryImageUrl,
      additionalImages ? JSON.stringify(additionalImages) : null,
      startingPrice,
      startingPrice,
      reservePrice || null,
      startTime,
      endTime
    ];

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, values);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating auction: ${error.message}`);
    }
  }

  /**
   * Update auction
   */
  static async updateAuction(auctionId, updateData) {
    const allowedFields = ['title', 'description', 'category', 'primary_image_url', 'additional_images', 'status'];
    
    let query = 'UPDATE Auctions SET ';
    const values = [];
    const fields = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'additional_images') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    query += fields.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE auction_id = ?';
    values.push(auctionId);

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, values);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating auction: ${error.message}`);
    }
  }

  /**
   * Delete auction (only if status is pending)
   */
  static async deleteAuction(auctionId) {
    const query = 'DELETE FROM Auctions WHERE auction_id = ? AND status = "pending"';

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [auctionId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting auction: ${error.message}`);
    }
  }

  /**
   * Get auctions by seller ID
   */
  static async getAuctionsBySeller(sellerId, filters = {}) {
    const { status = null, limit = 20, offset = 0 } = filters;
    let query = 'SELECT * FROM Auctions WHERE seller_id = ?';
    const values = [sellerId];

    if (status) {
      query += ' AND status = ?';
      values.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching seller auctions: ${error.message}`);
    }
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(auctionId) {
    const query = 'UPDATE Auctions SET views_count = views_count + 1 WHERE auction_id = ?';

    try {
      const connection = await pool.getConnection();
      await connection.execute(query, [auctionId]);
      connection.release();
    } catch (error) {
      console.error(`Error incrementing view count: ${error.message}`);
    }
  }

  /**
   * Update auction status
   */
  static async updateAuctionStatus(auctionId, status) {
    const query = 'UPDATE Auctions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE auction_id = ?';

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [status, auctionId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating auction status: ${error.message}`);
    }
  }

  /**
   * Get expired auctions
   */
  static async getExpiredAuctions() {
    const query = `
      SELECT * FROM Auctions 
      WHERE status = 'active' AND end_time < NOW()
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching expired auctions: ${error.message}`);
    }
  }

  /**
   * Update highest bidder
   */
  static async updateHighestBidder(auctionId, userId, bidAmount) {
    const query = `
      UPDATE Auctions 
      SET highest_bidder_id = ?, current_price = ?, bid_count = bid_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE auction_id = ?
    `;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [userId, bidAmount, auctionId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating highest bidder: ${error.message}`);
    }
  }

  /**
   * Get total auctions count
   */
  static async getTotalCount(filters = {}) {
    const { status = null, category = null } = filters;
    let query = 'SELECT COUNT(*) as total FROM Auctions WHERE 1=1';
    const values = [];

    if (status) {
      query += ' AND status = ?';
      values.push(status);
    }

    if (category) {
      query += ' AND category = ?';
      values.push(category);
    }

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();
      return results[0]?.total || 0;
    } catch (error) {
      throw new Error(`Error getting total count: ${error.message}`);
    }
  }
}

module.exports = AuctionModel;
