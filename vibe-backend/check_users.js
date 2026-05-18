const { pool } = require('./src/config/database');
async function check() {
  const [rows] = await pool.execute('SELECT email, role FROM Users');
  console.log(rows);
  process.exit(0);
}
check();
