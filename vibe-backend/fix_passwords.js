const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function fix() {
  const hash = await bcrypt.hash('password123', 12);
  console.log('Hash:', hash);
  
  // Update admin
  await pool.execute('UPDATE Users SET password_hash = ? WHERE email = ?', [hash, 'mehtab1234@gmail.com']);
  // Update buyer
  await pool.execute('UPDATE Users SET password_hash = ? WHERE email = ?', [hash, 'mehtabkhanmks784@gmail.com']);
  // Update seller
  await pool.execute('UPDATE Users SET password_hash = ? WHERE email = ?', [hash, 'mehtabkhanmks785@gmail.com']);
  
  console.log('✓ Passwords updated');
  process.exit(0);
}
fix();
