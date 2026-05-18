const CartModel = require('../models/Cart');

class CartController {
  static async getCart(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const items = await CartModel.getUserCart(userId);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  static async addToCart(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { auctionId } = req.params;

      if (!auctionId || isNaN(parseInt(auctionId))) {
        return res.status(400).json({ success: false, error: 'Invalid auction ID' });
      }

      await CartModel.addToCart(userId, parseInt(auctionId));

      res.status(201).json({ success: true, message: 'Added to cart' });
    } catch (error) {
      next(error);
    }
  }

  static async removeFromCart(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { auctionId } = req.params;

      if (!auctionId || isNaN(parseInt(auctionId))) {
        return res.status(400).json({ success: false, error: 'Invalid auction ID' });
      }

      await CartModel.removeFromCart(userId, parseInt(auctionId));
      res.json({ success: true, message: 'Removed from cart' });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      await CartModel.clearCart(userId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      next(error);
    }
  }

  static async getCartCount(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const items = await CartModel.getUserCart(userId);
      res.json({ success: true, data: { count: Array.isArray(items) ? items.length : 0 } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;
