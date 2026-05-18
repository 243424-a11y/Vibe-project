// Custom hooks for React components

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socket';

/**
 * Hook to use Socket.IO connections
 */
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { socket: socketService.socket, isConnected };
};

/**
 * Hook for real-time auction updates
 */
export const useAuctionUpdates = (auctionId) => {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !auctionId) return;

    socketService.joinAuction(auctionId, (response) => {
      if (response?.success) {
        console.log('Joined auction:', auctionId);
      }
    });

    socketService.onBidPlaced((data) => {
      setAuction(prev => ({
        ...prev,
        current_price: data.newPrice,
        bid_count: data.bidCount
      }));
      setBids(prev => [data, ...prev].slice(0, 10));
    });

    socketService.onCountdownUpdate((data) => {
      setAuction(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining
      }));
    });

    socketService.onAuctionEnded((data) => {
      setAuction(prev => ({
        ...prev,
        status: 'closed',
        finalPrice: data.finalPrice
      }));
    });

    return () => {
      socketService.leaveAuction(auctionId);
      socketService.offBidPlaced();
      socketService.offCountdownUpdate();
      socketService.offAuctionEnded();
    };
  }, [auctionId, socket]);

  return { auction, bids };
};

/**
 * Hook for notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socketService.onUserOutbid((data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'outbid',
        message: `You've been outbid on ${data.auctionTitle}`,
        data
      }, ...prev].slice(0, 10));
    });

    socketService.onNotification((data) => {
      setNotifications(prev => [{
        id: Date.now(),
        ...data
      }, ...prev].slice(0, 10));
    });

    return () => {
      socketService.offUserOutbid();
      socketService.offNotification();
    };
  }, [socket]);

  return { notifications, setNotifications };
};

/**
 * Hook for countdown timer
 */
export const useCountdown = (endTime) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(endTime);
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return { timeRemaining, formatTime: () => formatTime(timeRemaining) };
};

export default {
  useSocket,
  useAuctionUpdates,
  useNotifications,
  useCountdown
};
