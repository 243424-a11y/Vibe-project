/**
 * User Controller - Business logic for user operations
 */

const UserModel = require('../models/User');

class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req, res, next) {
    try {
      const { user_id: userId } = req.user;

      const profile = await UserModel.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      const user = await UserModel.getUserById(parseInt(userId));

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { username, phone, location, bio } = req.body;

      const updated = await UserModel.updateProfile(userId, {
        username,
        phone,
        location,
        bio
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          error: 'Failed to update profile'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user preferences
   */
  static async getPreferences(req, res, next) {
    try {
      const { user_id: userId } = req.user;

      const preferences = await UserModel.getUserPreferences(userId);

      res.json({
        success: true,
        data: preferences || {
          emailNotifications: true,
          outbidAlerts: true,
          auctionReminders: true,
          darkMode: false,
          language: 'en'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update preferences
   */
  static async updatePreferences(req, res, next) {
    try {
      const { user_id: userId } = req.user;

      await UserModel.updatePreferences(userId, req.body);

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { limit = 20 } = req.query;

      const notifications = await UserModel.getUserNotifications(userId, parseInt(limit));

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(req, res, next) {
    try {
      const { notificationId } = req.params;

      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid notification ID'
        });
      }

      const marked = await UserModel.markNotificationAsRead(parseInt(notificationId));

      if (!marked) {
        return res.status(400).json({
          success: false,
          error: 'Failed to mark notification'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const { user_id: userId } = req.user;

      const count = await UserModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add to wishlist
   */
  static async addToWishlist(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { auctionId } = req.body;

      if (!auctionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing auctionId'
        });
      }

      const added = await UserModel.addToWishlist(userId, parseInt(auctionId));

      if (!added) {
        return res.status(400).json({
          success: false,
          error: 'Failed to add to wishlist or already in wishlist'
        });
      }

      res.json({
        success: true,
        message: 'Added to wishlist'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove from wishlist
   */
  static async removeFromWishlist(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { auctionId } = req.params;

      if (!auctionId || isNaN(auctionId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const removed = await UserModel.removeFromWishlist(userId, parseInt(auctionId));

      if (!removed) {
        return res.status(400).json({
          success: false,
          error: 'Failed to remove from wishlist'
        });
      }

      res.json({
        success: true,
        message: 'Removed from wishlist'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wishlist
   */
  static async getWishlist(req, res, next) {
    try {
      const { user_id: userId } = req.user;

      const wishlist = await UserModel.getUserWishlist(userId);

      res.json({
        success: true,
        data: wishlist
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
