/**
 * Database Configuration
 */

const mysql = require('mysql2/promise');
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vibe_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  charset: 'utf8mb4'
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✓ MySQL connection pool created');
    connection.release();
  })
  .catch(err => {
    console.warn('⚠ MySQL connection error (will start server anyway):', err.message);
    // Don't exit on database error - allow server to start in demo mode
  });

module.exports = {
  getConnection: async () => {
    return pool.getConnection();
  },
  query: async (sql, values = []) => {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      connection.release();
    }
  },
  pool
};
