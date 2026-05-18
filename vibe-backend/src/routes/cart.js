const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CartController = require('../controllers/CartController');
const rateLimit = require('express-rate-limit');

// Rate limiter for count endpoint to prevent flooding from clients
const countLimiter = rateLimit({
	windowMs: 10 * 1000, // 10 seconds
	max: 6, // limit each IP to 6 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, error: 'Too many requests to /cart/count, please slow down.' }
});

router.get('/count', countLimiter, authenticate, CartController.getCartCount);
router.get('/', authenticate, CartController.getCart);
router.post('/:auctionId', authenticate, CartController.addToCart);
router.delete('/:auctionId', authenticate, CartController.removeFromCart);
router.delete('/', authenticate, CartController.clearCart);

module.exports = router;
