import { pool } from "../config/database";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcrypt";

const migrations = [
  "001_create_users.sql",
  "002_create_projekte.sql",
  "003_create_komponenten.sql",
  "004_create_protokolle.sql",
  "005_create_checklisten.sql",
  "006_create_aufgaben.sql",
  "007_create_chat.sql",
  // "008_seed_data.sql", // Deaktiviert - keine Seed-Daten
  "009_alter_komponenten_nullable.sql",
  "010_add_komponenten_ids_to_projekte.sql",
  "011_update_user_roles.sql",
  "012_set_stefan_admin.sql",
  "013_add_erforderliche_rolle_to_aufgaben.sql",
  "014_add_analyse_role.sql",
  "015_add_komponenten_typ_to_checklisten.sql",
  "016_create_projekt_komponenten.sql",
  "017_fix_checklisten_typ_constraint.sql",
  "018_create_chat_reads.sql",
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    for (const migration of migrations) {
      const filePath = join(__dirname, migration);
      const sql = readFileSync(filePath, "utf-8");
      
      console.log(`Running migration: ${migration}`);
      await client.query(sql);
      console.log(`✓ Migration ${migration} completed`);
    }
    
    // Update user passwords with real bcrypt hashes
    const passwordHash = await bcrypt.hash("password123", 10);
    const users = [
      'stefan.haering',
      'jamie.szymiczek',
      'michael.weber',
      'thomas.mueller',
      'anna.schmidt'
    ];
    
    for (const username of users) {
      await client.query(
        "UPDATE users SET password_hash = $1 WHERE username = $2",
        [passwordHash, username]
      );
    }
    
    console.log("✓ User passwords updated with real bcrypt hashes");
    
    await client.query("COMMIT");
    console.log("\n✓ All migrations completed successfully!");
  } catch (error: any) {
    // Wenn Fehler wegen bereits existierender Tabellen/Indizes, trotzdem Passwörter aktualisieren
    if (error?.code === '42P07' || error?.code === '23505') {
      console.log("⚠ Some migrations already applied, continuing with password update...");
      await client.query("ROLLBACK");
      await client.query("BEGIN");
    } else {
      await client.query("ROLLBACK");
      console.error("Migration failed:", error);
      throw error;
    }
  }
  
  // Passwörter immer aktualisieren (auch wenn Migrationen bereits ausgeführt wurden)
  try {
    const passwordHash = await bcrypt.hash("password123", 10);
    const users = [
      'stefan.haering',
      'jamie.szymiczek',
      'michael.weber',
      'thomas.mueller',
      'anna.schmidt'
    ];
    
    for (const username of users) {
      await client.query(
        "UPDATE users SET password_hash = $1 WHERE username = $2",
        [passwordHash, username]
      );
    }
    
    // Update auch für Benutzer nach Name (für den Fall, dass E-Mail anders ist)
    await client.query(
      "UPDATE users SET password_hash = $1 WHERE name = $2",
      [passwordHash, 'Stefan']
    );
    
    await client.query("COMMIT");
    console.log("✓ User passwords updated with real bcrypt hashes");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Password update failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error("Error running migrations:", error);
  process.exit(1);
});

