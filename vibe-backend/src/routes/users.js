/**
 * User Routes - Complete implementation
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const UserController = require('../controllers/UserController');

// Profile Routes
router.get('/profile', authenticate, UserController.getProfile);
router.get('/profile/:userId', UserController.getUserById);
router.put('/profile', authenticate, UserController.updateProfile);

// Preferences Routes
router.get('/preferences', authenticate, UserController.getPreferences);
router.put('/preferences', authenticate, UserController.updatePreferences);

// Notifications Routes
router.get('/notifications', authenticate, UserController.getNotifications);
router.put('/notifications/:notificationId/read', authenticate, UserController.markNotificationRead);
router.get('/notifications/unread-count', authenticate, UserController.getUnreadCount);

// Wishlist Routes
router.get('/wishlist', authenticate, UserController.getWishlist);
router.post('/wishlist', authenticate, UserController.addToWishlist);
router.delete('/wishlist/:auctionId', authenticate, UserController.removeFromWishlist);

module.exports = router;
