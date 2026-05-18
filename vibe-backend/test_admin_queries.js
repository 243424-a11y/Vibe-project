const { pool } = require('./src/config/database');

async function test() {
  try {
    const connection = await pool.getConnection();

    // 1. Get stats
    console.log("--- STATS ---");
    const [userStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers,
        SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as total_buyers,
        SUM(CASE WHEN is_blocked = 0 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_users
      FROM Users
    `);
    console.log(userStats[0]);

    // 2. Get users
    console.log("--- USERS ---");
    const [users] = await connection.execute(`
        SELECT 
          user_id,
          username,
          email,
          role,
          is_blocked,
          created_at,
          (SELECT COUNT(*) FROM Auctions WHERE seller_id = Users.user_id AND status = 'sold') as total_auctions_sold,
          seller_rating
        FROM Users
        WHERE 1=1 ORDER BY created_at DESC LIMIT 50 OFFSET 0
    `);
    console.log(users.length);

    // 3. Get auctions
    console.log("--- AUCTIONS ---");
    const [auctions] = await connection.execute(`
        SELECT 
          a.*,
          u.username as seller_name,
          COUNT(b.bid_id) as bid_count
        FROM Auctions a
        LEFT JOIN Users u ON a.seller_id = u.user_id
        LEFT JOIN Bids b ON a.auction_id = b.auction_id
        GROUP BY a.auction_id
        ORDER BY a.created_at DESC
        LIMIT 100 OFFSET 0
    `);
    console.log(auctions.length);

    // 4. Get fraud logs
    console.log("--- FRAUD LOGS ---");
    const [fraudLogs] = await connection.execute(`
        SELECT f.*, u.username, a.title as auction_title
        FROM FraudLogs f
        LEFT JOIN Users u ON f.user_id = u.user_id
        LEFT JOIN Auctions a ON f.auction_id = a.auction_id
        ORDER BY f.detected_at DESC
        LIMIT 100
    `);
    console.log(fraudLogs.length);

    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('QUERY FAILED:', err);
    process.exit(1);
  }
}

test();
