import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../services/api';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart(auctionId);
      return { auctionId, message: response.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(auctionId);
      return { auctionId, message: response.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to remove from cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.clearCart();
      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to clear cart');
    }
  }
);

export const fetchCartCount = createAsyncThunk(
  'cart/fetchCartCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCartCount();
      return response.data.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch cart count');
    }
  }
);

const initialState = {
  items: [],
  count: 0,
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.count = (action.payload || []).length;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.count = state.count + 1;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.auction_id !== action.payload.auctionId);
        state.count = Math.max(0, state.count - 1);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.count = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchCartCount.fulfilled, (state, action) => {
        state.count = action.payload || 0;
      })
      .addCase(fetchCartCount.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export default cartSlice.reducer;
