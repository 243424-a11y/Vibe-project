import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Auction events
  joinAuction(auctionId, callback) {
    this.socket?.emit('joinAuction', { auctionId }, callback);
  }

  leaveAuction(auctionId) {
    this.socket?.emit('leaveAuction', { auctionId });
  }

  onBidPlaced(callback) {
    this.socket?.on('bidPlaced', callback);
  }

  onCountdownUpdate(callback) {
    this.socket?.on('countdownUpdate', callback);
  }

  onAuctionEnding(callback) {
    this.socket?.on('auctionEnding', callback);
  }

  onAuctionEnded(callback) {
    this.socket?.on('auctionEnded', callback);
  }

  onUserOutbid(callback) {
    this.socket?.on('userOutbid', callback);
  }

  onNotification(callback) {
    this.socket?.on('notification', callback);
  }

  // Remove listeners
  offBidPlaced() {
    this.socket?.off('bidPlaced');
  }

  offCountdownUpdate() {
    this.socket?.off('countdownUpdate');
  }

  offAuctionEnding() {
    this.socket?.off('auctionEnding');
  }

  offAuctionEnded() {
    this.socket?.off('auctionEnded');
  }

  offUserOutbid() {
    this.socket?.off('userOutbid');
  }

  offNotification() {
    this.socket?.off('notification');
  }
}

export default new SocketService();
