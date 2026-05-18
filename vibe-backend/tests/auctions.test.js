/**
 * Backend Tests - Auction Controller
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../server');
const AuctionModel = require('../models/Auction');

describe('Auction Controller', () => {
  let token;
  let userId;
  let auctionId;

  beforeAll(async () => {
    // Setup: Create test user and get token
    // This would be done via auth endpoints in actual tests
  });

  describe('GET /api/auctions', () => {
    it('should fetch auctions list', async () => {
      const res = await request(app)
        .get('/api/auctions');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/auctions?status=active');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter by price range', async () => {
      const res = await request(app)
        .get('/api/auctions?minPrice=100&maxPrice=1000');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/auctions?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/auctions', () => {
    it('should create auction with valid data', async () => {
      const res = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Auction',
          description: 'A test auction item',
          category: 'Electronics',
          primaryImageUrl: 'http://example.com/image.jpg',
          startingPrice: 100,
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.auction_id).toBeDefined();
      
      auctionId = res.body.data.auction_id;
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/auctions')
        .send({
          title: 'Test Auction',
          description: 'A test auction item',
          category: 'Electronics',
          primaryImageUrl: 'http://example.com/image.jpg',
          startingPrice: 100
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auctions/:id', () => {
    it('should fetch auction details', async () => {
      const res = await request(app)
        .get(`/api/auctions/${auctionId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.auction_id).toBe(auctionId);
    });

    it('should return 404 for non-existent auction', async () => {
      const res = await request(app)
        .get('/api/auctions/99999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auctions/stats', () => {
    it('should fetch auction statistics', async () => {
      const res = await request(app)
        .get('/api/auctions/stats');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active).toBeDefined();
      expect(res.body.data.sold).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });
  });
});
