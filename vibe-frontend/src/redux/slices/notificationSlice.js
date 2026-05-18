import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [
      { id: 1, type: 'bid', title: 'You were outbid', message: 'Someone placed a higher bid on Vintage Watch', time: '5 minutes ago', read: false },
      { id: 2, type: 'auction', title: 'Auction ending soon', message: 'Oil Painting auction ends in 2 hours', time: '1 hour ago', read: false },
      { id: 3, type: 'fraud', title: 'Security Alert', message: 'Suspicious activity detected and blocked', time: '3 hours ago', read: false },
    ],
    unreadCount: 3,
  },
  reducers: {
    addNotification: (state, action) => {
      const notif = { ...action.payload, id: Date.now(), read: false, time: 'Just now' };
      state.items.unshift(notif);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const notif = state.items.find(n => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.items.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markRead, markAllRead, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
