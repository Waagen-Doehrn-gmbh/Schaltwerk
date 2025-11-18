const bcrypt = require('bcrypt');
const { pool } = require('./dist/config/database');

async function updatePasswords() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const client = await pool.connect();
  
  try {
    const users = [
      'stefan.haering@schalti.de',
      'jamie.szymiczek@schalti.de',
      'michael.weber@schalti.de',
      'thomas.mueller@schalti.de',
      'anna.schmidt@schalti.de'
    ];
    
    for (const email of users) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [passwordHash, email]
      );
      console.log(`✓ Updated password for ${email}`);
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

