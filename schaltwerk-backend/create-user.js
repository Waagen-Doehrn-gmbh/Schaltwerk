const { pool } = require('./dist/config/database');
const bcrypt = require('bcrypt');

async function createUser() {
  const client = await pool.connect();
  
  try {
    const hash = await bcrypt.hash('password123', 10);
    
    await client.query(`
      INSERT INTO users (id, username, password_hash, name, initialen, rolle, berechtigungen) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      ON CONFLICT (username) DO NOTHING
    `, [
      '550e8400-e29b-41d4-a716-446655440001',
      'stefan.haering',
      hash,
      'Stefan Häring',
      'SH',
      'admin',
      '[]'
    ]);
    
    console.log('✓ User stefan.haering created with password: password123');
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createUser().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});


