/**
 * User Model - Database operations for users
 */

const { pool } = require('../config/database');
const bcryptjs = require('bcryptjs');

class UserModel {
  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const query = `
      SELECT user_id, username, email, bio, seller_rating, 
             total_auctions_sold, role, is_verified, is_blocked, created_at
      FROM Users WHERE user_id = ?
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const query = 'SELECT * FROM Users WHERE email = ?';

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [email]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT a.auction_id) as total_listings,
        COUNT(DISTINCT b.bid_id) as total_bids,
        AVG(a.current_price) as avg_selling_price
      FROM Users u
      LEFT JOIN Auctions a ON u.user_id = a.seller_id
      LEFT JOIN Bids b ON u.user_id = b.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, profileData) {
    const { username, bio } = profileData;
    
    const query = `
      UPDATE Users 
      SET username = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [username, bio, userId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId) {
    const query = 'SELECT * FROM UserPreferences WHERE user_id = ?';

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error fetching preferences: ${error.message}`);
    }
  }

  /**
   * Update user preferences (aligned with actual schema)
   */
  static async updatePreferences(userId, preferences) {
    const {
      favorite_categories = null,
      price_range_min = null,
      price_range_max = null
    } = preferences;

    const query = `
      INSERT INTO UserPreferences (user_id, favorite_categories, price_range_min, price_range_max)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        favorite_categories = VALUES(favorite_categories),
        price_range_min = VALUES(price_range_min),
        price_range_max = VALUES(price_range_max)
    `;

    try {
      const connection = await pool.getConnection();
      await connection.execute(query, [
        userId, 
        favorite_categories ? JSON.stringify(favorite_categories) : null, 
        price_range_min, 
        price_range_max
      ]);
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`Error updating preferences: ${error.message}`);
    }
  }

  /**
   * Update seller rating
   */
  static async updateSellerRating(userId, newRating) {
    const query = `
      UPDATE Users 
      SET seller_rating = ?, total_auctions_sold = total_auctions_sold + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [newRating, userId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating seller rating: ${error.message}`);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, limit = 20) {
    const query = `
      SELECT * FROM Notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId, limit]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching notifications: ${error.message}`);
    }
  }

  /**
   * Create notification (aligned with schema: type, message, is_read, related_auction_id)
   */
  static async createNotification(notificationData) {
    const {
      userId,
      type,
      title,
      message,
      relatedAuctionId = null,
      isRead = false
    } = notificationData;

    // Combine title+message since schema only has 'message' column
    const fullMessage = title ? `${title}: ${message}` : message;

    const query = `
      INSERT INTO Notifications (user_id, type, message, related_auction_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [
        userId, type, fullMessage, relatedAuctionId, isRead
      ]);
      connection.release();
      return result.insertId;
    } catch (error) {
      console.error(`Error creating notification: ${error.message}`);
      return null; // Don't crash for notification failures
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId) {
    const query = 'UPDATE Notifications SET is_read = true WHERE notification_id = ?';

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(query, [notificationId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking notification: ${error.message}`);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = false';

    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results[0]?.count || 0;
    } catch (error) {
      throw new Error(`Error fetching unread count: ${error.message}`);
    }
  }
}

module.exports = UserModel;
