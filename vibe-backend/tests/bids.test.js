/**
 * Backend Tests - Bid Controller
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../server');

describe('Bid Controller', () => {
  let token;
  let auctionId;
  let bidId;

  describe('POST /api/bids', () => {
    it('should place bid with valid data', async () => {
      const res = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${token}`)
        .send({
          auctionId: auctionId,
          bidAmount: 150
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bid_id).toBeDefined();
      
      bidId = res.body.data.bid_id;
    });

    it('should reject bid lower than minimum', async () => {
      const res = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${token}`)
        .send({
          auctionId: auctionId,
          bidAmount: 50
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/bids')
        .send({
          auctionId: auctionId,
          bidAmount: 150
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/bids/:auctionId/history', () => {
    it('should fetch bid history', async () => {
      const res = await request(app)
        .get(`/api/bids/${auctionId}/history`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/bids/:auctionId/highest', () => {
    it('should fetch highest bid', async () => {
      const res = await request(app)
        .get(`/api/bids/${auctionId}/highest`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bid_amount).toBeDefined();
    });
  });

  describe('GET /api/bids/user/my-bids', () => {
    it('should fetch user bids', async () => {
      const res = await request(app)
        .get('/api/bids/user/my-bids')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
