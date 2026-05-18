import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bidAPI } from '../../services/api';

export const fetchAuctionBids = createAsyncThunk(
  'bid/fetchAuctionBids',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await bidAPI.getAuctionBids(auctionId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch bids');
    }
  }
);

export const placeBid = createAsyncThunk(
  'bid/placeBid',
  async ({ auctionId, amount }, { rejectWithValue }) => {
    try {
      const response = await bidAPI.placeBid(auctionId, amount);
      return response.data.data;
    } catch (err) {
      const specificError = err.response?.data?.details?.[0];
      return rejectWithValue(specificError || err.response?.data?.error || 'Failed to place bid');
    }
  }
);

const initialState = {
  bids: [],
  myBids: [],
  loading: false,
  error: null,
  lastBidTime: null
};

const bidSlice = createSlice({
  name: 'bid',
  initialState,
  reducers: {
    addBid: (state, action) => {
      // Used by Socket.IO to insert a live bid
      state.bids.unshift(action.payload);
      state.lastBidTime = new Date().toISOString();
    },
    setMyBids: (state, action) => {
      state.myBids = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuctionBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuctionBids.fulfilled, (state, action) => {
        state.loading = false;
        state.bids = action.payload;
      })
      .addCase(fetchAuctionBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(placeBid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.loading = false;
        // bid will be added via socket event
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { addBid, setMyBids } = bidSlice.actions;
export default bidSlice.reducer;
