import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../redux/slices/notificationSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        if (!socketInstance || !socketInstance.connected) {
          socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 5000,
          });
        }

        if (isMounted) {
          socketRef.current = socketInstance;

          socketRef.current.on('connect', () => {
            console.log('✓ Socket.IO connected:', socketRef.current.id);
          });

          socketRef.current.on('connect_error', (err) => {
            console.warn('Socket.IO connection error:', err.message);
          });

          socketRef.current.on('bidPlaced', (data) => {
            if (isMounted) {
              dispatch(addNotification({
                type: 'bid',
                title: 'New Bid Placed',
                message: `Bid of $${data.newPrice?.toLocaleString()} on Item #${data.auctionId}`,
                data,
              }));
            }
          });

          socketRef.current.on('auctionEnded', (data) => {
            if (isMounted) {
              dispatch(addNotification({
                type: 'auction',
                title: 'Auction Ended',
                message: `"${data.title}" has closed. Final price: $${data.finalPrice?.toLocaleString()}`,
                data,
              }));
            }
          });

          socketRef.current.on('userOutbid', (data) => {
            if (isMounted) {
              dispatch(addNotification({
                type: 'outbid',
                title: 'You Were Outbid!',
                message: `Someone bid $${data.newPrice?.toLocaleString()} on "${data.auctionTitle}"`,
                data,
              }));
            }
          });
        }
      } catch (err) {
        console.warn('Socket.IO not available:', err.message);
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('bidPlaced');
        socketRef.current.off('auctionEnded');
        socketRef.current.off('userOutbid');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
      }
    };
  }, [dispatch]);

  const joinRoom = useCallback((auctionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinAuction', { auctionId });
      console.log(`Joined auction room: ${auctionId}`);
    }
  }, []);

  const leaveRoom = useCallback((auctionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveAuction', { auctionId });
    }
  }, []);

  const onBidUpdate = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('bidPlaced', callback);
    }
  }, []);

  const offBidUpdate = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off('bidPlaced', callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinRoom,
    leaveRoom,
    onBidUpdate,
    offBidUpdate,
  };
}
