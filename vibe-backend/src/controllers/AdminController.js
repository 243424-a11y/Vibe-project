/**
 * Admin Controller - Dashboard and admin operations
 */

const { pool } = require('../config/database');

class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req, res, next) {
    try {
      const connection = await pool.getConnection();

      // Get all stats in parallel
      const [userStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers,
          SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as total_buyers,
          SUM(CASE WHEN is_blocked = 0 THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_users
        FROM Users
      `);

      const [auctionStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_auctions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_auctions,
          SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_auctions,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_auctions,
          SUM(current_price) as total_revenue,
          SUM(CASE WHEN status = 'sold' THEN current_price ELSE 0 END) as total_sales
        FROM Auctions
      `);

      const [bidStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_bids,
          AVG(bid_amount) as avg_bid
        FROM Bids
      `);

      const [fraudStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_flags,
          SUM(CASE WHEN fraud_type = 'suspicious_pattern' THEN 1 ELSE 0 END) as high_risk,
          SUM(CASE WHEN fraud_type = 'shill_bidding' THEN 1 ELSE 0 END) as medium_risk,
          AVG(fraud_confidence) as avg_fraud_score
        FROM FraudLogs
        WHERE detected_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      connection.release();

      res.json({
        success: true,
        data: {
          users: userStats[0],
          auctions: auctionStats[0],
          bids: bidStats[0],
          fraud: fraudStats[0],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active auctions
   */
  static async getActiveAuctions(req, res, next) {
    try {
      const { page = 1, limit = 100 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const connection = await pool.getConnection();

      const [auctions] = await connection.execute(`
        SELECT 
          a.*,
          u.username as seller_name,
          COUNT(b.bid_id) as bid_count
        FROM Auctions a
        LEFT JOIN Users u ON a.seller_id = u.user_id
        LEFT JOIN Bids b ON a.auction_id = b.auction_id
        GROUP BY a.auction_id
        ORDER BY a.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `);

      const [total] = await connection.execute(`
        SELECT COUNT(*) as count FROM Auctions
      `);

      connection.release();

      res.json({
        success: true,
        data: auctions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0].count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user management data
   */
  static async getUserManagement(req, res, next) {
    try {
      const { page = 1, limit = 50, status = null, role = null, search = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT 
          user_id,
          username,
          email,
          role,
          is_blocked,
          created_at,
          (SELECT COUNT(*) FROM Auctions WHERE seller_id = Users.user_id AND status = 'sold') as total_auctions_sold,
          seller_rating
        FROM Users
        WHERE 1=1
      `;
      const values = [];

      if (status) {
        query += ' AND is_blocked = ?';
        values.push(status === 'blocked' ? 1 : 0);
      }

      if (role) {
        query += ' AND role = ?';
        values.push(role);
      }

      if (search) {
        query += ' AND (username LIKE ? OR email LIKE ?)';
        values.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

      const connection = await pool.getConnection();
      const [users] = await connection.execute(query, values);

      let countQuery = 'SELECT COUNT(*) as count FROM Users WHERE 1=1';
      const countValues = [];
      if (status) {
        countQuery += ' AND is_blocked = ?';
        countValues.push(status === 'blocked' ? 1 : 0);
      }
      if (role) {
        countQuery += ' AND role = ?';
        countValues.push(role);
      }
      if (search) {
        countQuery += ' AND (username LIKE ? OR email LIKE ?)';
        countValues.push(`%${search}%`, `%${search}%`);
      }

      const [total] = await connection.execute(countQuery, countValues);
      connection.release();

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0].count
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fraud logs
   */
  static async getFraudLogs(req, res, next) {
    try {
      const connection = await pool.getConnection();
      const [logs] = await connection.execute(`
        SELECT f.*, u.username, a.title as auction_title
        FROM FraudLogs f
        LEFT JOIN Users u ON f.user_id = u.user_id
        LEFT JOIN Auctions a ON f.auction_id = a.auction_id
        ORDER BY f.detected_at DESC
        LIMIT 100
      `);
      connection.release();
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fraud dashboard
   */
  static async getFraudDashboard(req, res, next) {
    try {
      const connection = await pool.getConnection();

      const [highRiskUsers] = await connection.execute(`
        SELECT 
          u.user_id,
          u.username,
          u.email,
          COUNT(f.fraud_log_id) as flag_count,
          AVG(f.fraud_confidence) as avg_score,
          MAX(f.detected_at) as last_flagged
        FROM Users u
        LEFT JOIN FraudLogs f ON u.user_id = f.user_id
        WHERE f.fraud_confidence > 0.7
        GROUP BY u.user_id
        ORDER BY avg_score DESC
        LIMIT 10
      `);

      const [recentFlags] = await connection.execute(`
        SELECT 
          f.*,
          u.username,
          a.title
        FROM FraudLogs f
        LEFT JOIN Users u ON f.user_id = u.user_id
        LEFT JOIN Auctions a ON f.auction_id = a.auction_id
        ORDER BY f.detected_at DESC
        LIMIT 50
      `);

      connection.release();

      res.json({
        success: true,
        data: {
          highRiskUsers,
          recentFlags,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system performance metrics
   */
  static async getPerformanceMetrics(req, res, next) {
    try {
      const connection = await pool.getConnection();

      const [queryMetrics] = await connection.execute(`
        SELECT 
          COUNT(*) as total_queries,
          AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) as avg_response_time
        FROM Auctions
        WHERE updated_at IS NOT NULL
      `);

      connection.release();

      res.json({
        success: true,
        data: {
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          queryMetrics: queryMetrics[0],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system logs
   */
  static async getSystemLogs(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;

      // In production, this would be fetching from your logging service
      // For now, returning a success response
      res.json({
        success: true,
        data: {
          logs: [],
          message: 'Logs available in production logging service'
        },
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
   * Block a user
   */
  static async blockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const connection = await pool.getConnection();
      
      await connection.execute(
        'UPDATE Users SET is_blocked = 1 WHERE user_id = ?',
        [userId]
      );
      
      connection.release();

      res.json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const connection = await pool.getConnection();
      
      await connection.execute(
        'UPDATE Users SET is_blocked = 0 WHERE user_id = ?',
        [userId]
      );
      
      connection.release();

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user and all their related records
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Delete related bids, likes, notifications, autobids, fraud logs
        await connection.execute('DELETE FROM Bids WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM Likes WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM Notifications WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM Autobids WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM FraudLogs WHERE user_id = ?', [userId]);
        
        // Handle auctions: delete bids on seller's auctions first, then delete auctions
        await connection.execute(`
          DELETE FROM Bids WHERE auction_id IN (SELECT auction_id FROM Auctions WHERE seller_id = ?)
        `, [userId]);
        await connection.execute('DELETE FROM Auctions WHERE seller_id = ?', [userId]);

        // Finally delete the user
        await connection.execute('DELETE FROM Users WHERE user_id = ?', [userId]);

        await connection.commit();
        res.json({
          success: true,
          message: 'User and all associated data deleted successfully'
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products for a specific seller
   */
  static async getSellerProducts(req, res, next) {
    try {
      const { sellerId } = req.params;
      const connection = await pool.getConnection();
      
      const [products] = await connection.execute(
        'SELECT * FROM Auctions WHERE seller_id = ? ORDER BY created_at DESC',
        [sellerId]
      );
      
      connection.release();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete or restrict a product (auction)
   */
  static async deleteProduct(req, res, next) {
    try {
      const { auctionId } = req.params;
      const connection = await pool.getConnection();
      
      // Admin can delete any auction
      await connection.execute(
        'DELETE FROM Auctions WHERE auction_id = ?',
        [auctionId]
      );
      
      connection.release();

      res.json({
        success: true,
        message: 'Product removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seller statistics
   */
  static async getSellerStats(req, res, next) {
    try {
      const connection = await pool.getConnection();

      const [topSellers] = await connection.execute(`
        SELECT 
          u.user_id,
          u.username,
          u.seller_rating,
          COUNT(a.auction_id) as total_listings,
          SUM(a.current_price) as total_revenue,
          SUM(CASE WHEN a.status = 'sold' THEN 1 ELSE 0 END) as sold_items
        FROM Users u
        LEFT JOIN Auctions a ON u.user_id = a.seller_id
        WHERE u.role = 'seller'
        GROUP BY u.user_id
        ORDER BY total_revenue DESC
        LIMIT 10
      `);

      connection.release();

      res.json({
        success: true,
        data: topSellers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get buyer statistics
   */
  static async getBuyerStats(req, res, next) {
    try {
      const connection = await pool.getConnection();

      const [topBuyers] = await connection.execute(`
        SELECT 
          u.user_id,
          u.username,
          COUNT(DISTINCT b.auction_id) as auctions_participated,
          COUNT(b.bid_id) as total_bids,
          SUM(CASE WHEN a.highest_bidder_id = b.user_id THEN 1 ELSE 0 END) as auctions_won,
          SUM(b.bid_amount) as total_spent
        FROM Users u
        LEFT JOIN Bids b ON u.user_id = b.user_id
        LEFT JOIN Auctions a ON b.auction_id = a.auction_id
        WHERE u.role = 'buyer'
        GROUP BY u.user_id
        ORDER BY total_spent DESC
        LIMIT 10
      `);

      connection.release();

      res.json({
        success: true,
        data: topBuyers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system configuration
   */
  static async getSystemConfig(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3001,
          database: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306
          },
          features: {
            realTimeUpdates: true,
            fraudDetection: true,
            autoBidding: true,
            notifications: true
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get recent fraud logs
   */
  static async getFraudLogs(req, res, next) {
    try {
      const connection = await pool.getConnection();
      const [logs] = await connection.execute(`
        SELECT f.*, u.username, a.title as auction_title
        FROM FraudLogs f
        LEFT JOIN Users u ON f.user_id = u.user_id
        LEFT JOIN Auctions a ON f.auction_id = a.auction_id
        ORDER BY f.detected_at DESC
        LIMIT 100
      `);
      connection.release();

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
