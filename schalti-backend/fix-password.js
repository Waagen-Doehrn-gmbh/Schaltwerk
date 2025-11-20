const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'schalti_pro',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixPassword() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE name = $2',
      [passwordHash, 'Stefan']
    );
    
    console.log(`✓ Password updated for Stefan (${result.rowCount} row(s) affected)`);
    
    // Verify the update
    const user = await pool.query('SELECT name, LEFT(password_hash, 20) as hash FROM users WHERE name = $1', ['Stefan']);
    console.log('User:', user.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixPassword();








