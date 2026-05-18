/**
 * Fraud Controller - Fraud detection and monitoring
 */

const BidModel = require('../models/Bid');
const UserModel = require('../models/User');

class FraudController {
  /**
   * Get fraud logs
   */
  static async getFraudLogs(req, res, next) {
    try {
      const { userId, auctionId, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = 'SELECT f.*, u.username FROM FraudLogs f LEFT JOIN Users u ON f.user_id = u.user_id WHERE 1=1';
      const values = [];

      if (userId) { query += ' AND f.user_id = ?'; values.push(parseInt(userId)); }
      if (auctionId) { query += ' AND f.auction_id = ?'; values.push(parseInt(auctionId)); }

      query += ' ORDER BY f.detected_at DESC LIMIT ? OFFSET ?';
      values.push(parseInt(limit), offset);

      const { pool } = require('../config/database');
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();

      res.json({
        success: true,
        data: { logs: results },
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fraud statistics
   */
  static async getFraudStats(req, res, next) {
    try {
      const { pool } = require('../config/database');
      const connection = await pool.getConnection();

      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_flags,
          SUM(CASE WHEN fraud_confidence > 0.7 THEN 1 ELSE 0 END) as high_risk,
          SUM(CASE WHEN fraud_confidence BETWEEN 0.4 AND 0.7 THEN 1 ELSE 0 END) as medium_risk,
          SUM(CASE WHEN fraud_confidence < 0.4 THEN 1 ELSE 0 END) as low_risk,
          AVG(fraud_confidence) as avg_fraud_score
        FROM FraudLogs
        WHERE detected_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      connection.release();

      res.json({
        success: true,
        data: stats[0] || { total_flags: 0, high_risk: 0, medium_risk: 0, low_risk: 0, avg_fraud_score: 0 }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Block user (Admin only)
   */
  static async blockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
      }

      const { pool } = require('../config/database');
      const connection = await pool.getConnection();
      await connection.execute(
        'UPDATE Users SET is_blocked = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [parseInt(userId)]
      );
      connection.release();

      res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unblock user (Admin only)
   */
  static async unblockUser(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
      }

      const { pool } = require('../config/database');
      const connection = await pool.getConnection();
      await connection.execute(
        'UPDATE Users SET is_blocked = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [parseInt(userId)]
      );
      connection.release();

      res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get high-risk users
   */
  static async getHighRiskUsers(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const { pool } = require('../config/database');
      const connection = await pool.getConnection();

      const [users] = await connection.execute(`
        SELECT 
          u.user_id, u.username, u.email,
          COUNT(f.fraud_log_id) as fraud_count,
          AVG(f.fraud_confidence) as avg_fraud_score,
          MAX(f.detected_at) as last_flagged
        FROM Users u
        LEFT JOIN FraudLogs f ON u.user_id = f.user_id
        WHERE f.fraud_confidence > 0.7
        GROUP BY u.user_id
        ORDER BY avg_fraud_score DESC
        LIMIT ?
      `, [parseInt(limit)]);

      connection.release();

      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate fraud report
   */
  static async generateReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      let query = `
        SELECT 
          DATE(detected_at) as date,
          COUNT(*) as total_flags,
          SUM(CASE WHEN fraud_confidence > 0.7 THEN 1 ELSE 0 END) as high_risk,
          AVG(fraud_confidence) as avg_score
        FROM FraudLogs WHERE 1=1
      `;
      const values = [];

      if (startDate) { query += ' AND detected_at >= ?'; values.push(new Date(startDate)); }
      if (endDate) { query += ' AND detected_at <= ?'; values.push(new Date(endDate)); }

      query += ' GROUP BY DATE(detected_at) ORDER BY date DESC';

      const { pool } = require('../config/database');
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, values);
      connection.release();

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get User Fraud History
   */
  static async getUserFraudHistory(req, res, next) {
    try {
      const { userId } = req.params;
      const { pool } = require('../config/database');
      const connection = await pool.getConnection();

      const [logs] = await connection.execute(
        'SELECT * FROM FraudLogs WHERE user_id = ? ORDER BY detected_at DESC',
        [userId]
      );
      connection.release();

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check specific bid fraud
   */
  static async checkBidFraud(req, res, next) {
    try {
      const { bidId } = req.params;
      const { pool } = require('../config/database');
      const connection = await pool.getConnection();

      const [logs] = await connection.execute(
        'SELECT * FROM FraudLogs WHERE bid_id = ?',
        [bidId]
      );
      connection.release();

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FraudController;
