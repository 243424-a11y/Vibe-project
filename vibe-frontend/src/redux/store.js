import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import auctionReducer from './slices/auctionSlice';
import bidReducer from './slices/bidSlice';
import notificationReducer from './slices/notificationSlice';
import cartReducer from './slices/cartSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    auction: auctionReducer,
    bid: bidReducer,
    notifications: notificationReducer,
    cart: cartReducer,
  },
});

export default store;
