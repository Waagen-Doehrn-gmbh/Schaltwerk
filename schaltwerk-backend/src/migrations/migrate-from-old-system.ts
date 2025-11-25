import Database from "better-sqlite3";
import { pool as newPool } from "../config/database";
import dotenv from "dotenv";
import { join } from "path";
import { existsSync } from "fs";

dotenv.config();

// Pfad zur SQLite-Datenbank
// Im Container: /alte_datenbank/db.sqlite3 (gemountet)
// Lokal: ../../../alte_datenbank/db.sqlite3
const OLD_DB_PATH = process.env.OLD_DB_PATH || (
  existsSync("/alte_datenbank/db.sqlite3") 
    ? "/alte_datenbank/db.sqlite3" 
    : join(__dirname, "../../../alte_datenbank/db.sqlite3")
);

// Tabellennamen in der alten Datenbank (Django-Format)
const OLD_TABLE_SCHALTSCHRAENKE = "dokumentation_schaltschrank";
const OLD_TABLE_ARBEITSPROTOKOLLE = "dokumentation_worklog";
const OLD_TABLE_USER = "auth_user";
const OLD_TABLE_PREDEFINED_TASK = "dokumentation_predefinedtask";
const OLD_TABLE_KOMPONENTE = "dokumentation_komponente";
const OLD_TABLE_SCHALTSCHRANK_KOMPONENTEN = "dokumentation_schaltschrank_relevante_komponenten";
const OLD_TABLE_WORKLOG_KOMPONENTEN = "dokumentation_worklog_abgeschlossene_komponenten";

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

interface OldKomponente {
  id: number;
  name: string;
  artikelnummer?: string;
  beschreibung?: string;
  vordefinierte_zeit?: number;
  checklist_required?: number; // SQLite boolean als integer
  grundplatte_komponente?: number; // SQLite boolean als integer
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

interface KomponenteMapping {
  oldId: number;
  newId: string;
}

interface ProtokollMapping {
  oldId: number;
  newId: string;
}

async function migrateData() {
  let oldDb: Database.Database | null = null;
  
  try {
    console.log("🔄 Starte Migration von altem System (SQLite)...\n");

    // Validiere SQLite-Datenbank-Pfad
    if (!existsSync(OLD_DB_PATH)) {
      throw new Error(`SQLite-Datenbank nicht gefunden: ${OLD_DB_PATH}`);
    }

    // Öffne SQLite-Datenbank
    console.log(`📡 Öffne SQLite-Datenbank: ${OLD_DB_PATH}`);
    oldDb = new Database(OLD_DB_PATH, { readonly: true });
    console.log("✓ SQLite-Datenbank erfolgreich geöffnet\n");

    // Validiere Tabellennamen
    const requiredTables = [
      OLD_TABLE_USER,
      OLD_TABLE_PREDEFINED_TASK,
      OLD_TABLE_SCHALTSCHRAENKE,
      OLD_TABLE_ARBEITSPROTOKOLLE,
      OLD_TABLE_KOMPONENTE,
      OLD_TABLE_SCHALTSCHRANK_KOMPONENTEN,
      OLD_TABLE_WORKLOG_KOMPONENTEN,
    ];

    console.log("🔍 Validiere Tabellennamen...");
    for (const table of requiredTables) {
      try {
        const result = oldDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number } | undefined;
        if (result === undefined) {
          throw new Error(`Tabelle ${table} nicht gefunden oder leer`);
        }
        console.log(`  ✓ ${table}: ${result.count} Einträge`);
      } catch (error: any) {
        console.warn(`  ⚠ Tabelle ${table} nicht gefunden oder Fehler: ${error.message}`);
      }
    }
    console.log("");

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

    // 3. Komponenten migrieren
    console.log("🔧 Migriere Komponenten...");
    const komponenteMapping = await migrateKomponenten(oldDb);
    console.log(`✓ ${komponenteMapping.length} Komponenten migriert\n`);

    // 4. Projekte migrieren
    console.log("📁 Migriere Projekte...");
    const projektMapping = await migrateProjekte(oldDb);
    console.log(`✓ ${projektMapping.length} Projekte migriert\n`);

    // 5. Projekt-Komponenten-Zuordnungen migrieren
    console.log("🔗 Migriere Projekt-Komponenten-Zuordnungen...");
    const projektKomponentenCount = await migrateProjektKomponenten(oldDb, projektMapping, komponenteMapping);
    console.log(`✓ ${projektKomponentenCount} Projekt-Komponenten-Zuordnungen migriert\n`);

    // 6. Protokolle migrieren
    console.log("📝 Migriere Protokolle...");
    const protokollMapping = await migrateProtokolle(oldDb, userMapping, projektMapping, taskMapping);
    console.log(`✓ ${protokollMapping.length} Protokolle migriert\n`);

    // 7. Abgeschlossene Komponenten in Protokollen migrieren
    console.log("✅ Migriere abgeschlossene Komponenten in Protokollen...");
    const abgeschlosseneKomponentenCount = await migrateAbgeschlosseneKomponenten(oldDb, komponenteMapping, protokollMapping);
    console.log(`✓ ${abgeschlosseneKomponentenCount} Protokolle mit abgeschlossenen Komponenten aktualisiert\n`);

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

async function migrateKomponenten(oldDb: Database.Database): Promise<KomponenteMapping[]> {
  const mapping: KomponenteMapping[] = [];

  try {
    // Hole alle Komponenten aus der alten Datenbank
    const oldKomponenten = oldDb.prepare(`
      SELECT id, name, artikelnummer, beschreibung, vordefinierte_zeit, checklist_required, grundplatte_komponente
      FROM ${OLD_TABLE_KOMPONENTE}
      ORDER BY id
    `).all() as OldKomponente[];

    console.log(`  📊 Gefunden: ${oldKomponenten.length} Komponenten`);

    // Hole alle Komponenten aus der neuen Datenbank (für Duplikat-Prüfung)
    const newKomponentenResult = await newPool.query(`
      SELECT id, name, artikel_nummer 
      FROM komponenten
    `);

    const newKomponentenByName = new Map<string, string>();
    const newKomponentenByArtikel = new Map<string, string>();
    
    for (const komponente of newKomponentenResult.rows) {
      if (komponente.name) {
        newKomponentenByName.set(komponente.name.toLowerCase(), komponente.id);
      }
      if (komponente.artikel_nummer) {
        newKomponentenByArtikel.set(komponente.artikel_nummer.toLowerCase(), komponente.id);
      }
    }

    for (const oldKomponente of oldKomponenten) {
      try {
        // Prüfe ob Komponente bereits existiert (basierend auf Name oder Artikelnummer)
        let existingKomponente: any = null;
        
        if (oldKomponente.name) {
          const existingByName = newKomponentenByName.get(oldKomponente.name.toLowerCase());
          if (existingByName) {
            existingKomponente = { id: existingByName };
          }
        }
        
        if (!existingKomponente && oldKomponente.artikelnummer) {
          const existingByArtikel = newKomponentenByArtikel.get(oldKomponente.artikelnummer.toLowerCase());
          if (existingByArtikel) {
            existingKomponente = { id: existingByArtikel };
          }
        }

        if (existingKomponente) {
          console.log(`  ⏭ Komponente "${oldKomponente.name}" bereits vorhanden, überspringe`);
          mapping.push({
            oldId: oldKomponente.id,
            newId: existingKomponente.id,
          });
          continue;
        }

        // Erstelle Komponente im neuen System
        // Komponenten können ohne projekt_id erstellt werden (Migration 009 macht projekt_id optional)
        // Die Zuordnung zu Projekten erfolgt später über projekt_komponenten
        const result = await newPool.query(
          `INSERT INTO komponenten (name, artikel_nummer, status, created_at, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            oldKomponente.name || "Unbenannte Komponente",
            oldKomponente.artikelnummer || "",
            null, // Status wird später pro Projekt in projekt_komponenten gesetzt
          ]
        );

        const newId = result.rows[0].id;
        mapping.push({
          oldId: oldKomponente.id,
          newId: newId,
        });

        console.log(`  ✓ "${oldKomponente.name}" (${oldKomponente.artikelnummer || "keine Artikelnummer"}) -> ${newId}`);
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Komponente ${oldKomponente.id} (${oldKomponente.name}):`, error.message);
      }
    }
  } catch (error: any) {
    console.error(`  ❌ Fehler beim Laden der Komponenten:`, error.message);
    throw error;
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

async function migrateProjektKomponenten(
  oldDb: Database.Database,
  projektMapping: ProjektMapping[],
  komponenteMapping: KomponenteMapping[]
): Promise<number> {
  let count = 0;
  const projektMap = new Map(projektMapping.map(m => [m.oldId, m.newId]));
  const komponenteMap = new Map(komponenteMapping.map(m => [m.oldId, m.newId]));

  try {
    // Hole alle Projekt-Komponenten-Zuordnungen aus der alten Datenbank
    const oldZuordnungen = oldDb.prepare(`
      SELECT schaltschrank_id, komponente_id
      FROM ${OLD_TABLE_SCHALTSCHRANK_KOMPONENTEN}
    `).all() as Array<{ schaltschrank_id: number; komponente_id: number }>;

    console.log(`  📊 Gefunden: ${oldZuordnungen.length} Projekt-Komponenten-Zuordnungen`);

    // Hole alle abgeschlossenen Komponenten aus WorkLogs für Status-Bestimmung
    const abgeschlosseneKomponenten = oldDb.prepare(`
      SELECT DISTINCT worklog_id, komponente_id
      FROM ${OLD_TABLE_WORKLOG_KOMPONENTEN}
    `).all() as Array<{ worklog_id: number; komponente_id: number }>;

    // Erstelle Map: (projekt_id, komponente_id) -> ist abgeschlossen
    const abgeschlossenMap = new Map<string, boolean>();
    
    // Für jede abgeschlossene Komponente, finde das zugehörige Projekt
    for (const abgeschlossen of abgeschlosseneKomponenten) {
      const worklog = oldDb.prepare(`
        SELECT schaltschrank_id FROM ${OLD_TABLE_ARBEITSPROTOKOLLE} WHERE id = ?
      `).get(abgeschlossen.worklog_id) as { schaltschrank_id: number } | undefined;
      
      if (worklog) {
        const newProjektId = projektMap.get(worklog.schaltschrank_id);
        const newKomponenteId = komponenteMap.get(abgeschlossen.komponente_id);
        if (newProjektId && newKomponenteId) {
          const key = `${newProjektId}:${newKomponenteId}`;
          abgeschlossenMap.set(key, true);
        }
      }
    }

    for (const zuordnung of oldZuordnungen) {
      try {
        const newProjektId = projektMap.get(zuordnung.schaltschrank_id);
        const newKomponenteId = komponenteMap.get(zuordnung.komponente_id);

        if (!newProjektId) {
          console.warn(`  ⚠ Projekt ${zuordnung.schaltschrank_id} nicht gefunden, überspringe Zuordnung`);
          continue;
        }

        if (!newKomponenteId) {
          console.warn(`  ⚠ Komponente ${zuordnung.komponente_id} nicht gefunden, überspringe Zuordnung`);
          continue;
        }

        // Prüfe ob Zuordnung bereits existiert
        const existingResult = await newPool.query(
          "SELECT id FROM projekt_komponenten WHERE projekt_id = $1 AND komponente_id = $2",
          [newProjektId, newKomponenteId]
        );

        if (existingResult.rows[0]) {
          // Aktualisiere Status falls Komponente abgeschlossen ist
          const key = `${newProjektId}:${newKomponenteId}`;
          if (abgeschlossenMap.get(key)) {
            await newPool.query(
              "UPDATE projekt_komponenten SET status = 'abgeschlossen' WHERE projekt_id = $1 AND komponente_id = $2",
              [newProjektId, newKomponenteId]
            );
          }
          continue;
        }

        // Bestimme Status: abgeschlossen wenn in abgeschlossenMap, sonst ausstehend
        const key = `${newProjektId}:${newKomponenteId}`;
        const status = abgeschlossenMap.get(key) ? "abgeschlossen" : "ausstehend";

        // Erstelle Zuordnung in projekt_komponenten
        await newPool.query(
          `INSERT INTO projekt_komponenten (projekt_id, komponente_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [newProjektId, newKomponenteId, status]
        );

        count++;
        if (count % 10 === 0) {
          process.stdout.write(`  ✓ ${count} Zuordnungen migriert...\r`);
        }
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Zuordnung (Projekt ${zuordnung.schaltschrank_id}, Komponente ${zuordnung.komponente_id}):`, error.message);
      }
    }

    if (count > 0) {
      console.log(`  ✓ ${count} Projekt-Komponenten-Zuordnungen migriert`);
    }
  } catch (error: any) {
    console.error(`  ❌ Fehler beim Laden der Projekt-Komponenten-Zuordnungen:`, error.message);
    throw error;
  }

  return count;
}

async function migrateProtokolle(
  oldDb: Database.Database,
  userMapping: UserMapping[],
  projektMapping: ProjektMapping[],
  taskMapping: TaskMapping[]
): Promise<ProtokollMapping[]> {
  const mapping: ProtokollMapping[] = [];
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
        const result = await newPool.query(
          `INSERT INTO protokolle (
            aufgabe, details, zeitaufwand, datum, user_id, projekt_id, created_at, updated_at
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
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

        const newProtokollId = result.rows[0].id;
        mapping.push({
          oldId: oldProtokoll.id,
          newId: newProtokollId,
        });

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

  return mapping;
}

async function migrateAbgeschlosseneKomponenten(
  oldDb: Database.Database,
  komponenteMapping: KomponenteMapping[],
  protokollMapping: ProtokollMapping[]
): Promise<number> {
  let count = 0;
  const komponenteMap = new Map(komponenteMapping.map(m => [m.oldId, m.newId]));
  const protokollMap = new Map(protokollMapping.map(m => [m.oldId, m.newId]));

  try {
    // Hole alle abgeschlossenen Komponenten aus der alten Datenbank
    const oldAbgeschlossene = oldDb.prepare(`
      SELECT worklog_id, komponente_id
      FROM ${OLD_TABLE_WORKLOG_KOMPONENTEN}
    `).all() as Array<{ worklog_id: number; komponente_id: number }>;

    console.log(`  📊 Gefunden: ${oldAbgeschlossene.length} abgeschlossene Komponenten in Protokollen`);

    // Gruppiere nach Protokoll-ID
    const komponentenByProtokoll = new Map<number, string[]>();
    for (const abgeschlossen of oldAbgeschlossene) {
      const newKomponenteId = komponenteMap.get(abgeschlossen.komponente_id);
      if (!newKomponenteId) {
        continue; // Komponente nicht migriert
      }

      if (!komponentenByProtokoll.has(abgeschlossen.worklog_id)) {
        komponentenByProtokoll.set(abgeschlossen.worklog_id, []);
      }
      komponentenByProtokoll.get(abgeschlossen.worklog_id)!.push(newKomponenteId);
    }

    // Aktualisiere jedes Protokoll mit abgeschlossenen Komponenten
    for (const [oldProtokollId, komponenteIds] of komponentenByProtokoll.entries()) {
      try {
        const newProtokollId = protokollMap.get(oldProtokollId);
        if (!newProtokollId) {
          console.warn(`  ⚠ Protokoll ${oldProtokollId} nicht gefunden, überspringe abgeschlossene Komponenten`);
          continue;
        }

        // Aktualisiere das Protokoll mit den abgeschlossenen Komponenten-IDs
        await newPool.query(
          `UPDATE protokolle 
           SET abgeschlossene_komponenten_ids = $1
           WHERE id = $2`,
          [komponenteIds, newProtokollId]
        );

        count++;
        if (count % 10 === 0) {
          process.stdout.write(`  ✓ ${count} Protokolle aktualisiert...\r`);
        }
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Protokoll ${oldProtokollId}:`, error.message);
      }
    }

    if (count > 0) {
      console.log(`  ✓ ${count} Protokolle mit abgeschlossenen Komponenten aktualisiert`);
    }
  } catch (error: any) {
    console.error(`  ❌ Fehler beim Laden der abgeschlossenen Komponenten:`, error.message);
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
