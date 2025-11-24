const bcrypt = require('bcrypt');
const { pool } = require('./dist/config/database');

async function updatePasswords() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const client = await pool.connect();
  
  try {
    const users = [
      'stefan.haering',
      'jamie.szymiczek',
      'michael.weber',
      'thomas.mueller',
      'anna.schmidt'
    ];
    
    for (const username of users) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [passwordHash, username]
      );
      console.log(`✓ Updated password for ${username}`);
    }
    
    console.log('\n✓ All passwords updated successfully!');
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

updatePasswords();

