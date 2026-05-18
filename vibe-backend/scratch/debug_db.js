const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function debug() {
  console.log('Testing DB connection...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vibe_db'
    });
    console.log('✓ Connected');

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM Auctions');
    console.log('Auctions count:', rows[0].count);

    const [users] = await connection.execute('SELECT user_id, username, email FROM Users LIMIT 5');
    console.log('Sample users:', users);

    await connection.end();
  } catch (err) {
    console.error('❌ DB Error:', err);
  }
}

debug();
