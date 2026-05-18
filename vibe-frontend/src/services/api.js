import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, email, password, role = 'buyer') =>
    apiClient.post('/auth/register', { username, email, password, role }),
  
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
  googleLogin: (credential, role) =>
    apiClient.post('/auth/google', { credential, role }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  getMe: () =>
    apiClient.get('/auth/me'),
  
  refresh: (refreshToken) =>
    apiClient.post('/auth/refresh', { refreshToken })
};

// Auction API
export const auctionAPI = {
  getAll: (filters = {}) =>
    apiClient.get('/auctions', { params: filters }),
  
  getById: (id) =>
    apiClient.get(`/auctions/${id}`),
  
  create: (data) =>
    apiClient.post('/auctions', data),
  
  update: (id, data) =>
    apiClient.put(`/auctions/${id}`, data),
  
  delete: (id) =>
    apiClient.delete(`/auctions/${id}`),
    
  toggleLike: (id) =>
    apiClient.post(`/auctions/${id}/like`),
    
  subscribe: (id, email) => apiClient.post(`/auctions/${id}/subscribe`, { email }),
  finalizeAuction: (id, action) => apiClient.post(`/auctions/${id}/finalize`, { action }),
  getRecommendedBid: (id) => apiClient.get(`/auctions/${id}/recommended-bid`),

  getSellerAuctions: (sellerId) =>
    apiClient.get(`/auctions/seller/${sellerId}`)
};

// Bid API
export const bidAPI = {
  placeBid: (auctionId, amount) =>
    apiClient.post('/bids', { auctionId, bidAmount: amount }),
  
  getAuctionBids: (auctionId, limit = 50) =>
    apiClient.get(`/auctions/${auctionId}/bids`, { params: { limit } }),
  
  getUserBids: () =>
    apiClient.get('/bids/user/my-bids')
};

// User API
export const userAPI = {
  getProfile: (id) =>
    apiClient.get(`/users/${id}`),
  
  updateProfile: (id, data) =>
    apiClient.put(`/users/${id}`, data)
};

// Fraud API
export const fraudAPI = {
  getUserScore: (userId) =>
    apiClient.get(`/fraud/detection/score/${userId}`),
  
  getFraudLogs: (filters = {}) =>
    apiClient.get('/fraud/logs', { params: filters })
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    apiClient.get('/admin/dashboard/stats'),
  
  getActiveAuctions: () =>
    apiClient.get('/admin/dashboard/auctions'),
  
  getUserManagement: (params = {}) =>
    apiClient.get('/admin/dashboard/users', { params }),
  
  getFraudLogs: () =>
    apiClient.get('/admin/dashboard/fraud'),
    
  getSystemLogs: () =>
    apiClient.get('/admin/dashboard/logs'),

  blockUser: (userId) =>
    apiClient.post(`/admin/users/${userId}/block`),

  unblockUser: (userId) =>
    apiClient.post(`/admin/users/${userId}/unblock`),

  deleteUser: (userId) =>
    apiClient.delete(`/admin/users/${userId}`),

  getSellerProducts: (sellerId) =>
    apiClient.get(`/admin/sellers/${sellerId}/products`),

  deleteProduct: (auctionId) =>
    apiClient.delete(`/admin/products/${auctionId}`),

  getSellerStats: () =>
    apiClient.get('/admin/stats/sellers'),

  getBuyerStats: () =>
    apiClient.get('/admin/stats/buyers')
};

// Cart API
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (auctionId) => apiClient.post(`/cart/${auctionId}`),
  removeFromCart: (auctionId) => apiClient.delete(`/cart/${auctionId}`),
  clearCart: () => apiClient.delete('/cart'),
  getCartCount: () => apiClient.get('/cart/count'),
};

export default apiClient;
