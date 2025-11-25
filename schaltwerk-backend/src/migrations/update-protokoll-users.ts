import Database from "better-sqlite3";
import { pool as newPool } from "../config/database";
import dotenv from "dotenv";
import { join } from "path";
import { existsSync } from "fs";

dotenv.config();

// Pfad zur SQLite-Datenbank
const OLD_DB_PATH = process.env.OLD_DB_PATH || (
  existsSync("/alte_datenbank/db.sqlite3") 
    ? "/alte_datenbank/db.sqlite3" 
    : join(__dirname, "../../../alte_datenbank/db.sqlite3")
);

const OLD_TABLE_USER = "auth_user";
const OLD_TABLE_ARBEITSPROTOKOLLE = "dokumentation_worklog";

interface OldUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface UserMapping {
  oldId: number;
  newId: string;
}

async function updateProtokollUsers() {
  let oldDb: Database.Database | null = null;
  
  try {
    console.log("🔄 Starte Aktualisierung der User-Zuordnungen in Protokollen...\n");

    // Validiere SQLite-Datenbank-Pfad
    if (!existsSync(OLD_DB_PATH)) {
      throw new Error(`SQLite-Datenbank nicht gefunden: ${OLD_DB_PATH}`);
    }

    // Öffne SQLite-Datenbank
    console.log(`📡 Öffne SQLite-Datenbank: ${OLD_DB_PATH}`);
    oldDb = new Database(OLD_DB_PATH, { readonly: true });
    console.log("✓ SQLite-Datenbank erfolgreich geöffnet\n");

    // Teste Verbindung zur neuen Datenbank
    console.log("📡 Teste Verbindung zur neuen Datenbank...");
    await newPool.query("SELECT 1");
    console.log("✓ Verbindung zur neuen Datenbank erfolgreich\n");

    // 1. User-Mapping erstellen
    console.log("👥 Erstelle User-Mapping...");
    const userMapping = await createUserMapping(oldDb);
    console.log(`✓ ${userMapping.length} Benutzer gemappt\n`);

    if (userMapping.length === 0) {
      console.warn("⚠ Keine User-Mappings gefunden. Bitte prüfen Sie die Benutzer in beiden Datenbanken.");
      return;
    }

    // 2. Hole alle Protokolle mit Admin-User
    console.log("📋 Suche Protokolle mit Admin-User...");
    const adminUsersResult = await newPool.query(`
      SELECT id FROM users WHERE rolle = 'admin'
    `);
    
    if (adminUsersResult.rows.length === 0) {
      console.warn("⚠ Keine Admin-User gefunden.");
      return;
    }

    const adminUserIds = adminUsersResult.rows.map(row => row.id);
    const adminUserIdsPlaceholder = adminUserIds.map((_, i) => `$${i + 1}`).join(', ');

    const protokolleResult = await newPool.query(`
      SELECT id, created_at 
      FROM protokolle 
      WHERE user_id IN (${adminUserIdsPlaceholder})
      ORDER BY created_at
    `, adminUserIds);

    console.log(`  📊 Gefunden: ${protokolleResult.rows.length} Protokolle mit Admin-User\n`);

    if (protokolleResult.rows.length === 0) {
      console.log("✓ Keine Protokolle zum Aktualisieren gefunden.");
      return;
    }

    // 3. Hole alle Protokolle aus der alten Datenbank mit employee_id
    console.log("🔍 Lade Protokolle aus alter Datenbank...");
    const oldProtokolle = oldDb.prepare(`
      SELECT id, employee_id, schaltschrank_id, work_date, created_at, stunden, details
      FROM ${OLD_TABLE_ARBEITSPROTOKOLLE}
      WHERE employee_id IS NOT NULL
      ORDER BY work_date, created_at
    `).all() as Array<{ 
      id: number; 
      employee_id: number; 
      schaltschrank_id: number; 
      work_date?: string; 
      created_at?: string;
      stunden?: number;
      details?: string;
    }>;

    console.log(`  📊 Gefunden: ${oldProtokolle.length} Protokolle mit employee_id\n`);

    // Erstelle Map: alte Protokoll-ID -> employee_id
    const protokollToEmployee = new Map<number, number>();
    for (const oldProtokoll of oldProtokolle) {
      protokollToEmployee.set(oldProtokoll.id, oldProtokoll.employee_id);
    }

    // 4. Erstelle Mapping: neue Protokoll-ID -> alte Protokoll-ID
    // Wir müssen die Protokolle anhand von Datum und Projekt zuordnen
    console.log("🔗 Ordne Protokolle zu...");
    
    // Hole Projekt-Mapping
    const projektMappingResult = await newPool.query(`
      SELECT p.id as new_id, p.schaltschrank_nummer
      FROM projekte p
      WHERE p.schaltschrank_nummer IS NOT NULL
    `);

    const projektBySchranknummer = new Map<string, string>();
    for (const projekt of projektMappingResult.rows) {
      if (projekt.schaltschrank_nummer) {
        projektBySchranknummer.set(projekt.schaltschrank_nummer, projekt.new_id);
      }
    }

    // Hole Schaltschranknummern aus alter DB
    const oldSchaltschraenke = oldDb.prepare(`
      SELECT id, schranknummer FROM dokumentation_schaltschrank
    `).all() as Array<{ id: number; schranknummer?: string }>;

    const schranknummerByOldId = new Map<number, string>();
    for (const schrank of oldSchaltschraenke) {
      if (schrank.schranknummer) {
        schranknummerByOldId.set(schrank.id, schrank.schranknummer);
      }
    }

    // Erstelle Map: (projekt_id, datum, stunden) -> Array von alten Protokoll-IDs
    // Gruppiere Protokolle nach Projekt, Datum und Zeitaufwand für bessere Zuordnung
    const protokollByProjektDatumStunden = new Map<string, Array<{ id: number; employee_id: number; details?: string }>>();
    for (const oldProtokoll of oldProtokolle) {
      const schranknummer = schranknummerByOldId.get(oldProtokoll.schaltschrank_id);
      if (!schranknummer) continue;
      
      const newProjektId = projektBySchranknummer.get(schranknummer);
      if (!newProjektId) continue;

      const datum = oldProtokoll.work_date 
        ? new Date(oldProtokoll.work_date).toISOString().split('T')[0]
        : (oldProtokoll.created_at ? new Date(oldProtokoll.created_at).toISOString().split('T')[0] : null);
      
      if (datum) {
        const stunden = oldProtokoll.stunden || 0;
        const key = `${newProjektId}:${datum}:${stunden.toFixed(2)}`;
        
        if (!protokollByProjektDatumStunden.has(key)) {
          protokollByProjektDatumStunden.set(key, []);
        }
        protokollByProjektDatumStunden.get(key)!.push({
          id: oldProtokoll.id,
          employee_id: oldProtokoll.employee_id,
          details: oldProtokoll.details,
        });
      }
    }

    // 5. Aktualisiere Protokolle
    console.log("✏️ Aktualisiere Protokolle...");
    const userMap = new Map(userMapping.map(m => [m.oldId, m.newId]));
    let updatedCount = 0;
    let skippedCount = 0;

    for (const protokoll of protokolleResult.rows) {
      try {
        // Hole Details des Protokolls
        const protokollDetails = await newPool.query(`
          SELECT projekt_id, datum::date as datum_date, zeitaufwand, details
          FROM protokolle
          WHERE id = $1
        `, [protokoll.id]);

        if (protokollDetails.rows.length === 0) continue;

        const projektId = protokollDetails.rows[0].projekt_id;
        const datumDate = protokollDetails.rows[0].datum_date;
        const zeitaufwandRaw = protokollDetails.rows[0].zeitaufwand;
        // Konvertiere Decimal/Numeric zu Number
        let zeitaufwand = 0;
        if (zeitaufwandRaw != null) {
          if (typeof zeitaufwandRaw === 'string') {
            zeitaufwand = parseFloat(zeitaufwandRaw);
          } else if (typeof zeitaufwandRaw === 'number') {
            zeitaufwand = zeitaufwandRaw;
          } else {
            // Decimal-Objekt von pg
            zeitaufwand = parseFloat(String(zeitaufwandRaw));
          }
        }
        const details = protokollDetails.rows[0].details || '';
        const datumStr = datumDate ? new Date(datumDate).toISOString().split('T')[0] : null;

        if (!datumStr) {
          skippedCount++;
          continue;
        }

        // Finde passende alte Protokolle
        const zeitaufwandStr = Number.isNaN(zeitaufwand) ? '0.00' : zeitaufwand.toFixed(2);
        const key = `${projektId}:${datumStr}:${zeitaufwandStr}`;
        const alteProtokolle = protokollByProjektDatumStunden.get(key);

        if (!alteProtokolle || alteProtokolle.length === 0) {
          skippedCount++;
          continue;
        }

        // Wenn mehrere Protokolle passen, versuche Details-Match
        let oldProtokoll = alteProtokolle[0]; // Standard: erstes Protokoll
        if (alteProtokolle.length > 1 && details) {
          // Versuche Details-Match
          const detailsLower = details.toLowerCase();
          const match = alteProtokolle.find(p => {
            if (!p.details) return false;
            return p.details.toLowerCase().includes(detailsLower) || 
                   detailsLower.includes(p.details.toLowerCase());
          });
          if (match) {
            oldProtokoll = match;
          }
        }

        // Finde employee_id
        const oldEmployeeId = oldProtokoll.employee_id;
        if (!oldEmployeeId) {
          skippedCount++;
          continue;
        }

        // Finde neue User-ID
        const newUserId = userMap.get(oldEmployeeId);
        if (!newUserId) {
          skippedCount++;
          continue;
        }

        // Prüfe ob User bereits korrekt zugeordnet ist
        const currentUser = await newPool.query(`
          SELECT user_id FROM protokolle WHERE id = $1
        `, [protokoll.id]);

        if (currentUser.rows[0]?.user_id === newUserId) {
          // Bereits korrekt zugeordnet
          continue;
        }

        // Aktualisiere Protokoll
        await newPool.query(`
          UPDATE protokolle 
          SET user_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newUserId, protokoll.id]);

        updatedCount++;
        if (updatedCount % 10 === 0) {
          process.stdout.write(`  ✓ ${updatedCount} Protokolle aktualisiert...\r`);
        }
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Protokoll ${protokoll.id}:`, error.message);
      }
    }

    console.log(`\n✓ ${updatedCount} Protokolle aktualisiert`);
    if (skippedCount > 0) {
      console.log(`  ⚠ ${skippedCount} Protokolle konnten nicht zugeordnet werden`);
    }

    console.log("\n✅ Aktualisierung abgeschlossen!");
  } catch (error: any) {
    console.error("❌ Fehler bei der Aktualisierung:", error);
    throw error;
  } finally {
    if (oldDb) {
      oldDb.close();
    }
    await newPool.end();
  }
}

async function createUserMapping(oldDb: Database.Database): Promise<UserMapping[]> {
  const mapping: UserMapping[] = [];

  try {
    // Hole alle Benutzer aus der alten Datenbank
    const oldUsers = oldDb.prepare(`
      SELECT id, username, email, first_name, last_name 
      FROM ${OLD_TABLE_USER}
    `).all() as OldUser[];

    // Hole alle Benutzer aus der neuen Datenbank
    const newUsersResult = await newPool.query(`
      SELECT id, email, name 
      FROM users
    `);

    const newUsersByEmail = new Map<string, string>();
    const newUsersByName = new Map<string, string>();

    for (const user of newUsersResult.rows) {
      if (user.email) {
        newUsersByEmail.set(user.email.toLowerCase(), user.id);
      }
      if (user.name) {
        newUsersByName.set(user.name.toLowerCase(), user.id);
      }
    }

    // Erstelle Mapping basierend auf Email oder Name
    for (const oldUser of oldUsers) {
      const email = oldUser.email?.toLowerCase();
      const name = oldUser.first_name && oldUser.last_name
        ? `${oldUser.first_name} ${oldUser.last_name}`.toLowerCase()
        : oldUser.username?.toLowerCase();

      let newUserId: string | undefined;

      // Versuche zuerst Email-Match
      if (email) {
        newUserId = newUsersByEmail.get(email);
      }

      // Falls kein Email-Match, versuche Name-Match
      if (!newUserId && name) {
        newUserId = newUsersByName.get(name);
      }

      if (newUserId) {
        mapping.push({
          oldId: oldUser.id,
          newId: newUserId,
        });
        console.log(`  ✓ ${oldUser.username} (${oldUser.email || name}) -> ${newUserId}`);
      } else {
        console.warn(`  ⚠ Kein Match gefunden für: ${oldUser.username} (${oldUser.email || name})`);
      }
    }
  } catch (error: any) {
    console.warn(`  ⚠ Konnte User-Mapping nicht erstellen: ${error.message}`);
  }

  return mapping;
}

// Hauptfunktion ausführen
if (require.main === module) {
  updateProtokollUsers()
    .then(() => {
      console.log("\n✅ Aktualisierung abgeschlossen!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Aktualisierung fehlgeschlagen:", error);
      process.exit(1);
    });
}

export { updateProtokollUsers };

