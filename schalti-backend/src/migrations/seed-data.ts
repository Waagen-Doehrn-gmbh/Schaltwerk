import { pool } from "../config/database";
import bcrypt from "bcrypt";

async function seedData() {
  const client = await pool.connect();
  
  try {
    // Hash für "password123"
    const passwordHash = await bcrypt.hash("password123", 10);
    
    // Update user passwords with real hashes
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'stefan.haering@schalti.de'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'jamie.szymiczek@schalti.de'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'michael.weber@schalti.de'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'thomas.mueller@schalti.de'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'anna.schmidt@schalti.de'
    `, [passwordHash]);
    
    console.log("✓ Seed data updated successfully!");
  } catch (error) {
    console.error("Seed data error:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});

