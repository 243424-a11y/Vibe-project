/**
 * Redis Configuration
 */

const redis = require('redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn('Redis: Max retries reached. Continuing without Redis.');
        return false; // Stop retrying
      }
      return retries * 1000;
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠ Redis connection warning:', error.message);
  }
})();

// Cache helper functions
const cache = {
  set: async (key, value, ttl = 300) => {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  },
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  },
  del: async (key) => {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  },
  clear: async () => {
    try {
      await redisClient.flushDb();
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
};

module.exports = {
  redisClient,
  cache
};
