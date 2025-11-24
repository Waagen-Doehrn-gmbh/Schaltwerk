import Database from "better-sqlite3";
import { pool as newPool } from "../config/database";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

// Pfad zur SQLite-Datenbank
const OLD_DB_PATH = process.env.OLD_DB_PATH || join(__dirname, "../../../alte_datenbank/db.sqlite3");

// Tabellennamen in der alten Datenbank (Django-Format)
const OLD_TABLE_SCHALTSCHRAENKE = "dokumentation_schaltschrank";
const OLD_TABLE_ARBEITSPROTOKOLLE = "dokumentation_worklog";
const OLD_TABLE_USER = "auth_user";
const OLD_TABLE_PREDEFINED_TASK = "dokumentation_predefinedtask";

// Status-Mapping: Alt -> Neu
const STATUS_MAPPING: Record<string, "planung" | "in_bearbeitung" | "abgeschlossen"> = {
  "PLANNED": "planung",
  "GEPLANT": "planung",
  "PLANUNG": "planung",
  "IN_PROGRESS": "in_bearbeitung",
  "AKTIV": "in_bearbeitung",
  "IN BEARBEITUNG": "in_bearbeitung",
  "IN_BEARBEITUNG": "in_bearbeitung",
  "COMPLETED": "abgeschlossen",
  "FERTIG": "abgeschlossen",
  "FERTIGGESTELLT": "abgeschlossen",
  "ABGESCHLOSSEN": "abgeschlossen",
};

interface OldSchaltschrank {
  id: number;
  identifier: string;
  schranknummer?: string;
  standort?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface OldWorkLog {
  id: number;
  schaltschrank_id: number;
  employee_id?: number;
  predefined_task_id?: number;
  details?: string;
  stunden?: number;
  work_date?: string;
  created_at?: string;
}

interface OldUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface OldPredefinedTask {
  id: number;
  name: string;
}

interface UserMapping {
  oldId: number;
  newId: string;
}

interface ProjektMapping {
  oldId: number;
  newId: string;
}

interface TaskMapping {
  oldId: number;
  newId: string;
}

async function migrateData() {
  let oldDb: Database.Database | null = null;
  
  try {
    console.log("🔄 Starte Migration von altem System (SQLite)...\n");

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

    // 2. Aufgaben-Mapping erstellen (für Protokolle)
    console.log("📋 Erstelle Aufgaben-Mapping...");
    const taskMapping = await createTaskMapping(oldDb);
    console.log(`✓ ${taskMapping.length} Aufgaben gemappt\n`);

    // 3. Projekte migrieren
    console.log("📁 Migriere Projekte...");
    const projektMapping = await migrateProjekte(oldDb);
    console.log(`✓ ${projektMapping.length} Projekte migriert\n`);

    // 4. Protokolle migrieren
    console.log("📝 Migriere Protokolle...");
    const protokollCount = await migrateProtokolle(oldDb, userMapping, projektMapping, taskMapping);
    console.log(`✓ ${protokollCount} Protokolle migriert\n`);

    console.log("✅ Migration erfolgreich abgeschlossen!");
  } catch (error: any) {
    console.error("❌ Fehler bei der Migration:", error);
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
    console.log("  ℹ Protokolle werden ohne User-Zuordnung migriert");
  }

  return mapping;
}

async function createTaskMapping(oldDb: Database.Database): Promise<TaskMapping[]> {
  const mapping: TaskMapping[] = [];

  try {
    // Hole alle Aufgaben aus der alten Datenbank
    const oldTasks = oldDb.prepare(`
      SELECT id, name 
      FROM ${OLD_TABLE_PREDEFINED_TASK}
    `).all() as OldPredefinedTask[];

    // Hole alle Aufgaben aus der neuen Datenbank
    const newTasksResult = await newPool.query(`
      SELECT id, name 
      FROM aufgaben
    `);

    const newTasksByName = new Map<string, string>();
    for (const task of newTasksResult.rows) {
      newTasksByName.set(task.name.toLowerCase(), task.id);
    }

    // Erstelle Mapping basierend auf Name
    for (const oldTask of oldTasks) {
      const taskName = oldTask.name.toLowerCase();
      const newTaskId = newTasksByName.get(taskName);

      if (newTaskId) {
        mapping.push({
          oldId: oldTask.id,
          newId: newTaskId,
        });
        console.log(`  ✓ "${oldTask.name}" -> ${newTaskId}`);
      } else {
        // Erstelle neue Aufgabe, falls nicht vorhanden
        try {
          const result = await newPool.query(
            `INSERT INTO aufgaben (name, created_at, updated_at)
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id`,
            [oldTask.name]
          );
          const newId = result.rows[0].id;
          mapping.push({
            oldId: oldTask.id,
            newId: newId,
          });
          console.log(`  ✓ Neue Aufgabe erstellt: "${oldTask.name}" -> ${newId}`);
        } catch (error: any) {
          console.warn(`  ⚠ Konnte Aufgabe "${oldTask.name}" nicht erstellen: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    console.warn(`  ⚠ Konnte Aufgaben-Mapping nicht erstellen: ${error.message}`);
  }

  return mapping;
}

async function migrateProjekte(oldDb: Database.Database): Promise<ProjektMapping[]> {
  const mapping: ProjektMapping[] = [];

  try {
    // Hole alle Schaltschränke aus der alten Datenbank
    const oldProjekte = oldDb.prepare(`
      SELECT id, identifier, schranknummer, standort, status, created_at, updated_at
      FROM ${OLD_TABLE_SCHALTSCHRAENKE}
      ORDER BY id
    `).all() as OldSchaltschrank[];

    console.log(`  📊 Gefunden: ${oldProjekte.length} Schaltschränke`);

    for (const oldProjekt of oldProjekte) {
      try {
        // Prüfe ob Projekt bereits existiert (basierend auf Schaltschranknummer)
        let existingProjekt: any = null;
        
        if (oldProjekt.schranknummer) {
          const existingResult = await newPool.query(
            "SELECT id FROM projekte WHERE schaltschrank_nummer = $1",
            [oldProjekt.schranknummer]
          );
          existingProjekt = existingResult.rows[0];
        }

        if (existingProjekt) {
          console.log(`  ⏭ Projekt "${oldProjekt.identifier}" (${oldProjekt.schranknummer}) bereits vorhanden, überspringe`);
          mapping.push({
            oldId: oldProjekt.id,
            newId: existingProjekt.id,
          });
          continue;
        }

        // Mappe Status
        const oldStatus = oldProjekt.status?.toUpperCase() || "";
        const newStatus = STATUS_MAPPING[oldStatus] || "planung";

        // Parse Datum (SQLite speichert als ISO-String)
        const createdAt = oldProjekt.created_at ? new Date(oldProjekt.created_at) : new Date();
        const updatedAt = oldProjekt.updated_at ? new Date(oldProjekt.updated_at) : new Date();

        // Erstelle Projekt im neuen System
        const result = await newPool.query(
          `INSERT INTO projekte (name, standort, status, schaltschrank_nummer, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            oldProjekt.identifier || "Unbenanntes Projekt",
            oldProjekt.standort || "Unbekannt",
            newStatus,
            oldProjekt.schranknummer || null,
            createdAt,
            updatedAt,
          ]
        );

        const newId = result.rows[0].id;
        mapping.push({
          oldId: oldProjekt.id,
          newId: newId,
        });

        console.log(`  ✓ "${oldProjekt.identifier}" (${oldProjekt.schranknummer || "keine Nummer"}) -> ${newId}`);
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Projekt ${oldProjekt.id} (${oldProjekt.identifier}):`, error.message);
      }
    }
  } catch (error: any) {
    console.error(`  ❌ Fehler beim Laden der Projekte:`, error.message);
    throw error;
  }

  return mapping;
}

async function migrateProtokolle(
  oldDb: Database.Database,
  userMapping: UserMapping[],
  projektMapping: ProjektMapping[],
  taskMapping: TaskMapping[]
): Promise<number> {
  let count = 0;
  const userMap = new Map(userMapping.map(m => [m.oldId, m.newId]));
  const projektMap = new Map(projektMapping.map(m => [m.oldId, m.newId]));
  const taskMap = new Map(taskMapping.map(m => [m.oldId, m.newId]));

  try {
    // Hole alle Arbeitsprotokolle aus der alten Datenbank
    const oldProtokolle = oldDb.prepare(`
      SELECT id, schaltschrank_id, employee_id, predefined_task_id, details, stunden, work_date, created_at
      FROM ${OLD_TABLE_ARBEITSPROTOKOLLE}
      ORDER BY work_date, created_at
    `).all() as OldWorkLog[];

    console.log(`  📊 Gefunden: ${oldProtokolle.length} Protokolle`);

    // Hole Aufgabe-Namen für Protokolle ohne predefined_task_id
    const getTaskName = oldDb.prepare(`
      SELECT name FROM ${OLD_TABLE_PREDEFINED_TASK} WHERE id = ?
    `);

    for (const oldProtokoll of oldProtokolle) {
      try {
        // Finde neue Projekt-ID
        const newProjektId = projektMap.get(oldProtokoll.schaltschrank_id);
        if (!newProjektId) {
          console.warn(`  ⚠ Protokoll ${oldProtokoll.id}: Projekt ${oldProtokoll.schaltschrank_id} nicht gefunden, überspringe`);
          continue;
        }

        // Finde neue User-ID (optional, falls kein User vorhanden)
        let newUserId: string | undefined = undefined;
        if (oldProtokoll.employee_id) {
          newUserId = userMap.get(oldProtokoll.employee_id);
          if (!newUserId) {
            console.warn(`  ⚠ Protokoll ${oldProtokoll.id}: User ${oldProtokoll.employee_id} nicht gefunden, verwende ersten Admin`);
            // Fallback: Verwende ersten Admin-User
            const adminResult = await newPool.query(
              "SELECT id FROM users WHERE rolle = 'admin' LIMIT 1"
            );
            if (adminResult.rows[0]) {
              newUserId = adminResult.rows[0].id;
            }
          }
        } else {
          // Falls kein User, verwende ersten Admin
          const adminResult = await newPool.query(
            "SELECT id FROM users WHERE rolle = 'admin' LIMIT 1"
          );
          if (adminResult.rows[0]) {
            newUserId = adminResult.rows[0].id;
          }
        }

        if (!newUserId) {
          console.warn(`  ⚠ Protokoll ${oldProtokoll.id}: Kein User verfügbar, überspringe`);
          continue;
        }

        // Finde Aufgabe-Name
        let aufgabeName = "Keine Aufgabe angegeben";
        if (oldProtokoll.predefined_task_id) {
          const taskId = taskMap.get(oldProtokoll.predefined_task_id);
          if (taskId) {
            const taskResult = await newPool.query(
              "SELECT name FROM aufgaben WHERE id = $1",
              [taskId]
            );
            if (taskResult.rows[0]) {
              aufgabeName = taskResult.rows[0].name;
            }
          } else {
            // Versuche Name direkt aus alter DB zu holen
            try {
              const taskRow = getTaskName.get(oldProtokoll.predefined_task_id) as { name: string } | undefined;
              if (taskRow) {
                aufgabeName = taskRow.name;
              }
            } catch (e) {
              // Ignoriere Fehler
            }
          }
        }

        // Parse Datum
        const datum = oldProtokoll.work_date 
          ? new Date(oldProtokoll.work_date) 
          : (oldProtokoll.created_at ? new Date(oldProtokoll.created_at) : new Date());
        const createdAt = oldProtokoll.created_at ? new Date(oldProtokoll.created_at) : new Date();

        // Erstelle Protokoll im neuen System
        await newPool.query(
          `INSERT INTO protokolle (
            aufgabe, details, zeitaufwand, datum, user_id, projekt_id, created_at, updated_at
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            aufgabeName,
            oldProtokoll.details || null,
            oldProtokoll.stunden || 0,
            datum,
            newUserId,
            newProjektId,
            createdAt,
            createdAt,
          ]
        );

        count++;
        if (count % 10 === 0) {
          process.stdout.write(`  ✓ ${count} Protokolle migriert...\r`);
        }
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Protokoll ${oldProtokoll.id}:`, error.message);
      }
    }

    if (count > 0) {
      console.log(`  ✓ ${count} Protokolle migriert`);
    }
  } catch (error: any) {
    console.error(`  ❌ Fehler beim Laden der Protokolle:`, error.message);
    throw error;
  }

  return count;
}

// Hauptfunktion ausführen
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log("\n✅ Migration abgeschlossen!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration fehlgeschlagen:", error);
      process.exit(1);
    });
}

export { migrateData };
