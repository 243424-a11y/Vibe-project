import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auctionAPI } from '../../services/api';

export const fetchAuctions = createAsyncThunk(
  'auction/fetchAuctions',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getAll(filters);
      return response.data.data; // Assuming backend returns { success: true, data: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch auctions');
    }
  }
);

export const fetchAuctionById = createAsyncThunk(
  'auction/fetchAuctionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.getById(id);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch auction details');
    }
  }
);

export const toggleLike = createAsyncThunk(
  'auction/toggleLike',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auctionAPI.toggleLike(id);
      return { id, ...response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to toggle like');
    }
  }
);

const initialState = {
  auctions: [],
  selectedAuction: null,
  loading: false,
  error: null,
  filters: {
    category: '',
    priceMin: 0,
    priceMax: 100000,
    sortBy: 'ending_soon'
  }
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedAuction: (state) => {
      state.selectedAuction = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuctions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctions.fulfilled, (state, action) => {
        state.loading = false;
        state.auctions = action.payload;
      })
      .addCase(fetchAuctions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAuctionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAuction = action.payload;
      })
      .addCase(fetchAuctionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        if (state.selectedAuction && state.selectedAuction.auction_id === action.payload.id) {
          state.selectedAuction.likes_count = action.payload.count;
          state.selectedAuction.is_liked = action.payload.liked;
        }
        // Also update in the list if present
        const auction = state.auctions.find(a => a.auction_id === action.payload.id);
        if (auction) {
          auction.likes_count = action.payload.count;
          auction.is_liked = action.payload.liked;
        }
      });
  }
});

export const { setFilters, clearSelectedAuction } = auctionSlice.actions;
export default auctionSlice.reducer;

