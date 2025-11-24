const bcrypt = require('bcrypt');
const { pool } = require('./dist/config/database');

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    console.log("🗑️  Lösche alle Daten...");
    
    // Lösche alle Daten in der richtigen Reihenfolge (wegen Foreign Keys)
    await client.query("DELETE FROM chat_messages");
    await client.query("DELETE FROM protokolle");
    await client.query("DELETE FROM komponenten");
    await client.query("DELETE FROM projekte");
    await client.query("DELETE FROM aufgaben");
    await client.query("DELETE FROM checklisten");
    await client.query("DELETE FROM users");
    
    console.log("✓ Alle Daten gelöscht");
    
    // Erstelle neuen Benutzer Stefan
    const passwordHash = await bcrypt.hash("1234Pass!", 10);
    
    const result = await client.query(
      `INSERT INTO users (id, username, password_hash, name, initialen, rolle, berechtigungen)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, name, rolle`,
      [
        '550e8400-e29b-41d4-a716-446655440001',
        'stefan',
        passwordHash,
        'Stefan',
        'ST',
        'admin',
        JSON.stringify(["abnahme", "endabnahme"])
      ]
    );
    
    console.log("✓ Benutzer Stefan erstellt:");
    console.log(`  - Username: ${result.rows[0].username}`);
    console.log(`  - Name: ${result.rows[0].name}`);
    console.log(`  - Rolle: ${result.rows[0].rolle}`);
    console.log(`  - Passwort: 1234Pass!`);
    
    await client.query("COMMIT");
    console.log("\n✅ Datenbank erfolgreich zurückgesetzt!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Fehler beim Zurücksetzen der Datenbank:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});










