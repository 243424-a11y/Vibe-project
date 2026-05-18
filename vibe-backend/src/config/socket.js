/**
 * Socket.IO Real-Time Configuration - Complete Implementation
 */

const { redisClient } = require('./redis');

function setupSocketIO(io) {
  // Connection handling
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.id}`);
    let userId = null;

    // User authentication
    socket.on('authenticate', (data) => {
      userId = data.userId;
      socket.join(`user:${userId}`);
      socket.emit('authenticated', { success: true });
    });

    // Join auction room
    socket.on('joinAuction', (data, callback) => {
      const { auctionId } = data;
      const roomName = `auction:${auctionId}`;
      socket.join(roomName);
      
      // Notify others in room
      socket.to(roomName).emit('userJoinedAuction', {
        auctionId: auctionId,
        timestamp: new Date().toISOString()
      });
      
      if (callback) {
        callback({
          success: true,
          message: `Joined auction ${auctionId}`
        });
      }
    });

    // Leave auction room
    socket.on('leaveAuction', (data) => {
      const { auctionId } = data;
      const roomName = `auction:${auctionId}`;
      socket.leave(roomName);
      
      socket.to(roomName).emit('userLeftAuction', {
        auctionId: auctionId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle bid placement
    socket.on('placeBid', (data) => {
      const { auctionId, bidAmount } = data;
      // This is just a socket acknowledgment - actual bid processing happens in API
      socket.emit('bidAcknowledged', {
        auctionId: auctionId,
        status: 'processing'
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Broadcast helpers - attached to global object for use in controllers
  global.broadcastBid = (auctionId, bidData) => {
    const room = `auction:${auctionId}`;
    io.to(room).emit('bidPlaced', {
      bidId: bidData.bid_id,
      auctionId: auctionId,
      newPrice: bidData.bid_amount,
      bidCount: bidData.bid_count,
      bidderUsername: bidData.username || 'Anonymous',
      bidTime: new Date().toISOString(),
      highestBidderId: bidData.user_id
    });
  };

  global.broadcastOutbid = (userId, auctionData) => {
    io.to(`user:${userId}`).emit('userOutbid', {
      userId: userId,
      auctionId: auctionData.auction_id,
      auctionTitle: auctionData.title,
      newPrice: auctionData.current_price,
      newBidderName: 'Anonymous',
      timestamp: new Date().toISOString()
    });
  };

  global.broadcastCountdown = (auctionId, timeRemaining) => {
    const room = `auction:${auctionId}`;
    io.to(room).emit('countdownUpdate', {
      auctionId: auctionId,
      timeRemaining: timeRemaining, // in seconds
      timestamp: new Date().toISOString()
    });
  };

  global.broadcastAuctionEnding = (auctionId, auctionData) => {
    const room = `auction:${auctionId}`;
    io.to(room).emit('auctionEnding', {
      auctionId: auctionId,
      title: auctionData.title,
      timeRemaining: 5 * 60, // 5 minutes
      currentPrice: auctionData.current_price,
      timestamp: new Date().toISOString()
    });
  };

  global.broadcastAuctionEnded = (auctionId, auctionData) => {
    const room = `auction:${auctionId}`;
    io.to(room).emit('auctionEnded', {
      auctionId: auctionId,
      title: auctionData.title,
      winnerName: auctionData.highest_bidder_name || 'Not specified',
      finalPrice: auctionData.current_price,
      timestamp: new Date().toISOString()
    });

    // Clear room
    io.in(room).socketsLeave(room);
  };

  return io;
}

module.exports = {
  setupSocketIO
};
