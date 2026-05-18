const { pool } = require('../config/database');

class CartModel {
  static async addToCart(userId, auctionId) {
    try {
      const connection = await pool.getConnection();
      await connection.execute('INSERT IGNORE INTO Cart (user_id, auction_id) VALUES (?, ?)', [userId, auctionId]);
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`Error adding to cart: ${error.message}`);
    }
  }

  static async removeFromCart(userId, auctionId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute('DELETE FROM Cart WHERE user_id = ? AND auction_id = ?', [userId, auctionId]);
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing from cart: ${error.message}`);
    }
  }

  static async getUserCart(userId) {
    const query = `
      SELECT c.cart_id, c.added_at, a.*,
        u.username as seller_name, u.seller_rating
      FROM Cart c
      JOIN Auctions a ON c.auction_id = a.auction_id
      LEFT JOIN Users u ON a.seller_id = u.user_id
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC
    `;
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, [userId]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(`Error fetching user cart: ${error.message}`);
    }
  }

  static async isInCart(userId, auctionId) {
    if (!userId) return false;
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute('SELECT 1 FROM Cart WHERE user_id = ? AND auction_id = ? LIMIT 1', [userId, auctionId]);
      connection.release();
      return results.length > 0;
    } catch (error) {
      return false;
    }
  }

  static async clearCart(userId) {
    try {
      const connection = await pool.getConnection();
      await connection.execute('DELETE FROM Cart WHERE user_id = ?', [userId]);
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
  }
}

module.exports = CartModel;
