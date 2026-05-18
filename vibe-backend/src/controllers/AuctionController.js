/**
 * Auction Controller - Business logic for auction operations
 */

const AuctionModel = require('../models/Auction');
const BidService = require('../services/bidService');

class AuctionController {
  /**
   * Get all auctions with filters
   */
  static async getAuctions(req, res, next) {
    try {
      const {
        status = 'active',
        category,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        page = 1,
        limit = 20,
        minPrice,
        maxPrice,
        sellerId
      } = req.query;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      const auctions = await AuctionModel.getAllAuctions({
        status,
        category: category || null,
        sortBy,
        sortOrder,
        limit: limitNum,
        offset,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sellerId: sellerId ? parseInt(sellerId) : null
      });

      const total = await AuctionModel.getTotalCount({
        status: status || null,
        category: category || null
      });

      res.json({
        success: true,
        data: auctions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get auction details by ID
   */
  static async getAuctionDetail(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const auction = await AuctionModel.getAuctionById(parseInt(id));

      if (!auction) {
        return res.status(404).json({
          success: false,
          error: 'Auction not found'
        });
      }

      // Increment view count asynchronously
      AuctionModel.incrementViewCount(parseInt(id)).catch(err => {
        console.error('Error incrementing views:', err);
      });

      res.json({
        success: true,
        data: auction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new auction
   */
  static async createAuction(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const {
        title,
        description,
        category,
        categoryId,
        primaryImageUrl,
        images,
        additionalImages,
        startingPrice,
        startPrice,
        reservePrice,
        startTime,
        endTime
      } = req.body;

      // Map frontend field names to backend
      const finalCategory = category || (['Antiques', 'Art', 'Jewelry', 'Collectibles', 'Electronics'][parseInt(categoryId) - 1]) || 'Other';
      const finalStartingPrice = parseFloat(startingPrice || startPrice);
      const finalPrimaryImage = primaryImageUrl || (images && images[0]) || 'https://images.unsplash.com/photo-1588626601614-22b07e7b6401?w=800&q=80';
      const finalAdditionalImages = additionalImages || (images && images.slice(1)) || [];

      // Validation
      if (!title || !description || !finalStartingPrice) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, startingPrice'
        });
      }

      if (isNaN(finalStartingPrice) || finalStartingPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Starting price must be a positive number'
        });
      }

      // Calculate times
      const parsedStartTime = startTime ? new Date(startTime) : new Date();
      const parsedEndTime = endTime ? new Date(endTime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (parsedStartTime >= parsedEndTime) {
        return res.status(400).json({
          success: false,
          error: 'End time must be after start time'
        });
      }

      // Convert to MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
      const formatMySQLDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

      const auctionId = await AuctionModel.createAuction({
        sellerId: userId,
        title,
        description,
        category: finalCategory,
        primaryImageUrl: finalPrimaryImage,
        additionalImages: finalAdditionalImages,
        startingPrice: finalStartingPrice,
        reservePrice: reservePrice ? parseFloat(reservePrice) : null,
        startTime: formatMySQLDate(parsedStartTime),
        endTime: formatMySQLDate(parsedEndTime)
      });

      res.status(201).json({
        success: true,
        message: 'Auction created successfully',
        data: { auction_id: auctionId }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update auction
   */
  static async updateAuction(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id: userId } = req.user;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const auction = await AuctionModel.getAuctionById(parseInt(id));

      if (!auction) {
        return res.status(404).json({
          success: false,
          error: 'Auction not found'
        });
      }

      // Only seller or admin can update
      if (auction.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this auction'
        });
      }

      // Sellers can only edit pending auctions; admins can edit any
      if (req.user.role !== 'admin' && auction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Can only update pending auctions'
        });
      }

      const updated = await AuctionModel.updateAuction(parseInt(id), updateData);
      
      if (updated && updateData.status && global.io) {
        global.io.emit('auctionStatusUpdate', { 
          auctionId: parseInt(id), 
          status: updateData.status 
        });
      }

      if (!updated) {
        return res.status(400).json({
          success: false,
          error: 'Failed to update auction'
        });
      }

      res.json({
        success: true,
        message: 'Auction updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete auction
   */
  static async deleteAuction(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id: userId } = req.user;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid auction ID'
        });
      }

      const auction = await AuctionModel.getAuctionById(parseInt(id));

      if (!auction) {
        return res.status(404).json({
          success: false,
          error: 'Auction not found'
        });
      }

      // Only seller or admin can delete
      if (auction.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this auction'
        });
      }

      const deleted = await AuctionModel.deleteAuction(parseInt(id));

      if (!deleted) {
        return res.status(400).json({
          success: false,
          error: 'Can only delete pending auctions'
        });
      }

      res.json({
        success: true,
        message: 'Auction deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get auctions by seller
   */
  static async getSellerAuctions(req, res, next) {
    try {
      const { sellerId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      if (!sellerId || isNaN(sellerId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid seller ID'
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const auctions = await AuctionModel.getAuctionsBySeller(parseInt(sellerId), {
        status: status || null,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: auctions,
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
   * Get categories list
   */
  static async getCategories(req, res, next) {
    try {
      const categories = [
        'Electronics',
        'Jewelry',
        'Art',
        'Collectibles',
        'Antiques',
        'Fashion',
        'Books',
        'Sports',
        'Toys',
        'Home & Garden',
        'Automotive',
        'Furniture',
        'Other'
      ];

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get auction statistics
   */
  static async getAuctionStats(req, res, next) {
    try {
      const activeCount = await AuctionModel.getTotalCount({ status: 'active' });
      const closedCount = await AuctionModel.getTotalCount({ status: 'closed' });
      const soldCount = await AuctionModel.getTotalCount({ status: 'sold' });

      res.json({
        success: true,
        data: {
          active: activeCount,
          closed: closedCount,
          sold: soldCount,
          total: activeCount + closedCount + soldCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle like for an auction
   */
  static async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id: userId } = req.user;

      const result = await AuctionModel.toggleLike(parseInt(id), userId);
      const likeCount = await AuctionModel.getAuctionLikes(parseInt(id));

      // Broadcast like update via Socket.IO if possible
      if (global.io) {
        global.io.emit(`auction:${id}:like`, { count: likeCount });
      }

      res.json({
        success: true,
        data: {
          liked: result.liked,
          count: likeCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subscribe to auction updates
   */
  static async subscribeAuction(req, res, next) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required for subscription'
        });
      }

      // Save subscription to database
      const { pool } = require('../config/database');
      await pool.execute('INSERT INTO Subscriptions (auction_id, email) VALUES (?, ?)', [parseInt(id), email]);

      res.json({
        success: true,
        message: 'Subscribed successfully! You will receive real-time alerts for this auction.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bid history for an auction
   */
  static async getAuctionBids(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      const BidModel = require('../models/Bid');
      const bids = await BidModel.getBidHistory(parseInt(id), parseInt(limit));

      res.json({
        success: true,
        data: bids
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommended bid amount for an auction
   */
  static async getRecommendedBid(req, res, next) {
    try {
      const { id } = req.params;
      const recommended = await BidService.getRecommendedBid(parseInt(id));

      res.json({
        success: true,
        data: { recommended_bid: recommended }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Finalize auction (sold/completed)
   */
  static async finalizeAuction(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id: userId } = req.user;
      const { action } = req.body; // 'buy' or 'leave'

      const auction = await AuctionModel.getAuctionById(parseInt(id));

      if (!auction) {
        return res.status(404).json({ success: false, error: 'Auction not found' });
      }

      // Check if user is the winner
      if (auction.highest_bidder_id !== userId) {
        return res.status(403).json({ success: false, error: 'Only the winner can finalize this auction' });
      }

      if (action === 'buy') {
        // Mock transaction process
        await AuctionModel.updateAuctionStatus(parseInt(id), 'sold');
        
        // Broadcast finalization
        if (global.io) {
          global.io.emit('auctionStatusUpdate', { auctionId: parseInt(id), status: 'sold' });
        }
        
        // Update user stats
        const { pool } = require('../config/database');
        await pool.execute('UPDATE Users SET total_auctions_sold = total_auctions_sold + 1 WHERE user_id = ?', [auction.seller_id]);
        
        return res.json({
          success: true,
          message: 'Transaction successful! You are now the official owner of this product.',
          data: { status: 'sold' }
        });
      } else {
        // Reactivate the auction: set status to 'active', extend end_time by 24 hours, clear highest_bidder_id
        const { pool } = require('../config/database');
        await pool.execute(
          "UPDATE Auctions SET status = 'active', highest_bidder_id = NULL, end_time = DATE_ADD(NOW(), INTERVAL 24 HOUR), updated_at = CURRENT_TIMESTAMP WHERE auction_id = ?",
          [parseInt(id)]
        );
        
        // Broadcast reactivated status and new starting/current price
        if (global.io) {
          global.io.emit('auctionStatusUpdate', { 
            auctionId: parseInt(id), 
            status: 'active',
            currentPrice: auction.current_price,
            highestBidderId: null
          });
        }
        
        return res.json({
          success: true,
          message: 'You have left the bid. The auction has been reactivated for other buyers at your bid price.',
          data: { status: 'active', currentPrice: auction.current_price }
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuctionController;
