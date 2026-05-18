const { pool } = require('../src/config/database');

async function fix() {
  try {
    await pool.query("ALTER TABLE Notifications MODIFY COLUMN type ENUM('outbid','auction_ending','bid_placed','auction_won','auction_closed','recommended','fraud_alert','system') NOT NULL");
    console.log('✓ Successfully altered Notifications table column "type" to include "auction_closed"');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    process.exit(0);
  }
}

fix();
