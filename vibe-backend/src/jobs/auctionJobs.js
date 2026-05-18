/**
 * Auction Background Jobs
 * Handles scheduled tasks like auction ending, notifications, etc.
 */

const AuctionModel = require('../models/Auction');
const UserModel = require('../models/User');
const { redisClient } = require('../config/redis');

/**
 * Check and process expired auctions
 * Run every minute
 */
async function processExpiredAuctions() {
  try {
    const expiredAuctions = await AuctionModel.getExpiredAuctions();

    for (const auction of expiredAuctions) {
      // Update auction status
      await AuctionModel.updateAuctionStatus(auction.auction_id, 'closed');

      // If there's a highest bidder, mark as completed (pending winner's choice)
      if (auction.highest_bidder_id) {
        await AuctionModel.updateAuctionStatus(auction.auction_id, 'completed');
        
        // Broadcast via Socket.IO
        if (global.io) {
          global.io.emit('auctionStatusUpdate', { auctionId: auction.auction_id, status: 'completed' });
        }

        // Create notifications
        // Winner notification
        await UserModel.createNotification({
          userId: auction.highest_bidder_id,
          type: 'auction_won',
          title: 'You won an auction!',
          message: `Congratulations! You won ${auction.title} for ${auction.current_price}`,
          relatedAuctionId: auction.auction_id
        });

        // Seller notification
        await UserModel.createNotification({
          userId: auction.seller_id,
          type: 'auction_closed',
          title: 'Your auction has ended',
          message: `Your auction ${auction.title} has been sold for ${auction.current_price}`,
          relatedAuctionId: auction.auction_id
        });

        // Broadcast via Socket.IO if available
        if (global.broadcastAuctionEnded) {
          global.broadcastAuctionEnded(auction.auction_id, {
            title: auction.title,
            highest_bidder_name: auction.highest_bidder_name,
            current_price: auction.current_price
          });
        }
      } else {
        // No bids - create seller notification
        await UserModel.createNotification({
          userId: auction.seller_id,
          type: 'auction_closed',
          title: 'Your auction has ended',
          message: `Your auction ${auction.title} ended with no bids`,
          relatedAuctionId: auction.auction_id
        });
      }

      console.log(`✓ Processed expired auction: ${auction.auction_id}`);
    }
  } catch (error) {
    console.error('Error processing expired auctions:', error);
  }
}

/**
 * Send auction ending alerts (5 minutes before end)
 * Run every 30 seconds
 */
async function sendAuctionEndingAlerts() {
  try {
    const query = `
      SELECT * FROM Auctions 
      WHERE status = 'active' 
      AND end_time > NOW() 
      AND end_time <= DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      AND end_time > DATE_ADD(NOW(), INTERVAL 270 SECOND)
    `;

    const connection = await require('../config/database').pool.getConnection();
    const [auctions] = await connection.execute(query);
    connection.release();

    for (const auction of auctions) {
      // Broadcast alert via Socket.IO
      if (global.broadcastAuctionEnding) {
        global.broadcastAuctionEnding(auction.auction_id, auction);
      }

      // Create notifications for bidders
      const query = `
        SELECT DISTINCT user_id FROM Bids 
        WHERE auction_id = ?
      `;
      const bidConnection = await require('../config/database').pool.getConnection();
      const [bidders] = await bidConnection.execute(query, [auction.auction_id]);
      bidConnection.release();

      for (const bidder of bidders) {
        await UserModel.createNotification({
          userId: bidder.user_id,
          type: 'auction_ending',
          title: 'Auction ending soon!',
          message: `${auction.title} will end in 5 minutes`,
          relatedAuctionId: auction.auction_id
        });
      }
    }
  } catch (error) {
    console.error('Error sending auction ending alerts:', error);
  }
}

/**
 * Update countdown timers
 * Run every second
 */
async function updateCountdowns() {
  try {
    const query = `
      SELECT auction_id, end_time FROM Auctions 
      WHERE status = 'active'
    `;

    const connection = await require('../config/database').pool.getConnection();
    const [auctions] = await connection.execute(query);
    connection.release();

    for (const auction of auctions) {
      const timeRemaining = Math.floor((new Date(auction.end_time) - new Date()) / 1000);
      
      if (timeRemaining > 0) {
        // Broadcast countdown
        if (global.broadcastCountdown) {
          global.broadcastCountdown(auction.auction_id, timeRemaining);
        }
      }
    }
  } catch (error) {
    console.error('Error updating countdowns:', error);
  }
}

/**
 * Initialize background jobs
 */
function initializeJobs() {
  // Process expired auctions every 1 minute
  setInterval(processExpiredAuctions, 60 * 1000);

  // Send auction ending alerts every 30 seconds
  setInterval(sendAuctionEndingAlerts, 30 * 1000);

  // Update countdowns every second for active auctions
  // Note: This can be optimized by only running when needed
  // setInterval(updateCountdowns, 1000);

  console.log('✓ Background jobs initialized');
}

module.exports = {
  initializeJobs,
  processExpiredAuctions,
  sendAuctionEndingAlerts,
  updateCountdowns
};
