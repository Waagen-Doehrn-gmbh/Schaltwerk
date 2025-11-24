import { pool } from "../config/database";
import bcrypt from "bcrypt";

async function seedData() {
  const client = await pool.connect();
  
  try {
    // Hash für "password123"
    const passwordHash = await bcrypt.hash("password123", 10);
    
    // Update user passwords with real hashes
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'stefan.haering'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'jamie.szymiczek'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'michael.weber'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'thomas.mueller'
    `, [passwordHash]);
    
    await client.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'anna.schmidt'
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

