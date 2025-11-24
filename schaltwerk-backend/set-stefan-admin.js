const { pool } = require('./dist/config/database');

async function setStefanAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    console.log("🔧 Setze Stefan auf Admin-Rolle...");
    
    const result = await client.query(
      `UPDATE users 
       SET rolle = 'admin', 
           updated_at = CURRENT_TIMESTAMP
       WHERE name ILIKE '%Stefan%' 
          OR username ILIKE '%stefan%'
       RETURNING id, username, name, rolle`
    );
    
    if (result.rows.length === 0) {
      console.log("⚠️  Kein Benutzer mit dem Namen 'Stefan' gefunden.");
    } else {
      console.log("✅ Stefan erfolgreich auf Admin gesetzt:");
      result.rows.forEach(row => {
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Username: ${row.username}`);
        console.log(`  - Name: ${row.name}`);
        console.log(`  - Rolle: ${row.rolle}`);
      });
    }
    
    await client.query("COMMIT");
    console.log("\n✅ Erfolgreich abgeschlossen!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Fehler beim Setzen der Admin-Rechte:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setStefanAdmin().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

