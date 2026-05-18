const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const categories = [
  'Electronics', 'Jewelry', 'Art', 'Collectibles', 'Antiques', 
  'Fashion', 'Books', 'Sports', 'Toys', 'Home & Garden', 
  'Automotive', 'Furniture', 'Other'
];

const images = {
  Electronics: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1964&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526733158272-11144009ecd6?q=80&w=1974&auto=format&fit=crop'
  ],
  Jewelry: [
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=2047&auto=format&fit=crop'
  ],
  Automotive: [
    'https://images.unsplash.com/photo-1584345604476-8ec5e12e42a5?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b05503f3f5f4?q=80&w=2070&auto=format&fit=crop'
  ],
  Art: [
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=1958&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1890&auto=format&fit=crop'
  ],
  Collectibles: [
    'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=2080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593814681464-eef5af2b0628?q=80&w=2070&auto=format&fit=crop'
  ]
};

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mehti522',
    database: 'vibe_db'
  });

  try {
    console.log('🚀 Starting deep seed process...');
    
    // Clear existing data (optional, but good for demo consistency)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE Bids');
    await connection.query('TRUNCATE TABLE Auctions');
    await connection.query('TRUNCATE TABLE Users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🧹 Database cleared');

    const passwordHash = await bcrypt.hash('password123', 12);

    // 1. Create Admin
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role, is_verified) 
      VALUES (?, ?, ?, ?, ?)
    `, ['admin', 'admin@vibe.local', passwordHash, 'admin', true]);
    console.log('👤 Admin created');

    // 2. Create 30 Sellers
    const sellerIds = [];
    for (let i = 1; i <= 30; i++) {
      const [result] = await connection.query(`
        INSERT INTO Users (username, email, password_hash, role, is_verified, seller_rating) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `Seller_${i}`, 
        `seller${i}@vibe.local`, 
        passwordHash, 
        'seller', 
        true,
        (Math.random() * 2 + 3).toFixed(2) // Rating between 3.0 and 5.0
      ]);
      sellerIds.push(result.insertId);
    }
    console.log('👥 30 Sellers created');

    // 3. Create 30 Buyers
    const buyerIds = [];
    for (let i = 1; i <= 30; i++) {
      const [result] = await connection.query(`
        INSERT INTO Users (username, email, password_hash, role, is_verified) 
        VALUES (?, ?, ?, ?, ?)
      `, [`Buyer_${i}`, `buyer${i}@vibe.local`, passwordHash, 'buyer', true]);
      buyerIds.push(result.insertId);
    }
    console.log('👥 30 Buyers created');

    // 4. Create 120 Auctions (4 per seller)
    console.log('🔨 Creating 120 auctions...');
    for (const sellerId of sellerIds) {
      for (let j = 1; j <= 4; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const categoryImages = images[category] || images['Electronics'];
        const imageUrl = categoryImages[Math.floor(Math.random() * categoryImages.length)];
        const startingPrice = Math.floor(Math.random() * 5000) + 100;
        
        await connection.query(`
          INSERT INTO Auctions (
            seller_id, title, description, category, primary_image_url, 
            starting_price, current_price, reserve_price, 
            status, start_time, end_time, bid_count, views_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sellerId,
          `${category} Premium Item #${j} - Seller ${sellerId}`,
          `High-quality ${category.toLowerCase()} item in excellent condition. Guaranteed authentic and professionally appraised.`,
          category,
          imageUrl,
          startingPrice,
          startingPrice,
          startingPrice + 500,
          'active',
          new Date(Date.now() - Math.random() * 86400000).toISOString().slice(0, 19).replace('T', ' '),
          new Date(Date.now() + Math.random() * 604800000).toISOString().slice(0, 19).replace('T', ' '),
          0,
          Math.floor(Math.random() * 1000)
        ]);
      }
    }
    console.log('✅ 120 Auctions created');

    // 5. Create random bids
    const [auctions] = await connection.query('SELECT auction_id, current_price FROM Auctions');
    console.log('💰 Placing random bids...');
    for (const auction of auctions) {
      const numBids = Math.floor(Math.random() * 10);
      let lastPrice = auction.current_price;
      
      for (let k = 0; k < numBids; k++) {
        const bidAmount = lastPrice + (Math.random() * 100 + 10);
        const buyerId = buyerIds[Math.floor(Math.random() * buyerIds.length)];
        
        await connection.query(`
          INSERT INTO Bids (auction_id, user_id, bid_amount, bid_time) 
          VALUES (?, ?, ?, ?)
        `, [
          auction.auction_id,
          buyerId,
          bidAmount,
          new Date(Date.now() - (numBids - k) * 3600000).toISOString().slice(0, 19).replace('T', ' ')
        ]);
        
        lastPrice = bidAmount;
      }
      
      // Update auction with highest bid
      if (numBids > 0) {
        await connection.query(`
          UPDATE Auctions SET current_price = ?, bid_count = ? WHERE auction_id = ?
        `, [lastPrice, numBids, auction.auction_id]);
      }
    }
    console.log('✅ Random bids placed');

    console.log('✨ DEEP SEED COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await connection.end();
  }
}

seed();

