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

const OLD_TABLE_KOMPONENTE = "dokumentation_komponente";
const OLD_TABLE_CHECKLIST_ITEM = "dokumentation_komponentechecklistitem";
const OLD_TABLE_COMPLETION_CHECKLIST = "dokumentation_komponentecompletionchecklist";
const OLD_TABLE_COMPLETION_CHECKLIST_ITEMS = "dokumentation_komponentecompletionchecklist_checked_items";

interface OldChecklistItem {
  id: number;
  komponente_id: number;
  text: string;
  order: number;
  required: number; // SQLite boolean als integer
}

interface KomponenteMapping {
  oldId: number;
  newId: string;
}

async function migrateChecklisten() {
  let oldDb: Database.Database | null = null;
  
  try {
    console.log("🔄 Starte Migration der Checklisten (Aktivitäten)...\n");

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

    // 1. Hole Komponenten-Mapping
    console.log("🔧 Lade Komponenten-Mapping...");
    const komponenteMapping = await getKomponenteMapping();
    console.log(`✓ ${komponenteMapping.length} Komponenten gefunden\n`);

    if (komponenteMapping.length === 0) {
      console.warn("⚠ Keine Komponenten gefunden. Bitte führen Sie zuerst die Komponenten-Migration aus.");
      return;
    }

    const komponenteMap = new Map(komponenteMapping.map(m => [m.oldId, m.newId]));

    // 2. Hole alle Checklisten-Items aus der alten Datenbank
    console.log("📋 Lade Checklisten-Items aus alter Datenbank...");
    const oldChecklistItems = oldDb.prepare(`
      SELECT id, komponente_id, text, "order", required
      FROM ${OLD_TABLE_CHECKLIST_ITEM}
      ORDER BY komponente_id, "order", id
    `).all() as OldChecklistItem[];

    console.log(`  📊 Gefunden: ${oldChecklistItems.length} Checklisten-Items\n`);

    // 3. Gruppiere Checklisten-Items nach Komponente
    const itemsByKomponente = new Map<number, OldChecklistItem[]>();
    for (const item of oldChecklistItems) {
      if (!itemsByKomponente.has(item.komponente_id)) {
        itemsByKomponente.set(item.komponente_id, []);
      }
      itemsByKomponente.get(item.komponente_id)!.push(item);
    }

    // 4. Erstelle Checklisten für jede Komponente
    console.log("✏️ Erstelle Checklisten für Komponenten...");
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const [oldKomponenteId, items] of itemsByKomponente.entries()) {
      try {
        const newKomponenteId = komponenteMap.get(oldKomponenteId);
        if (!newKomponenteId) {
          skippedCount++;
          continue;
        }

        // Prüfe ob bereits eine Checkliste für diese Komponente existiert
        const existingChecklist = await newPool.query(`
          SELECT id FROM checklisten 
          WHERE typ = 'komponenten' 
          AND name = $1
        `, [`Komponente: ${oldKomponenteId}`]);

        // Erstelle Items-Array
        const checklistItems = items.map(item => ({
          id: item.id.toString(),
          text: item.text,
          order: item.order,
          required: item.required === 1,
        })).sort((a, b) => a.order - b.order);

        if (existingChecklist.rows.length > 0) {
          // Aktualisiere bestehende Checkliste
          await newPool.query(`
            UPDATE checklisten 
            SET items = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [JSON.stringify(checklistItems), existingChecklist.rows[0].id]);
          updatedCount++;
        } else {
          // Erstelle neue Checkliste
          // Hole Komponenten-Name für besseren Checklisten-Namen
          const komponenteName = oldDb.prepare(`
            SELECT name FROM ${OLD_TABLE_KOMPONENTE} WHERE id = ?
          `).get(oldKomponenteId) as { name: string } | undefined;

          const checklistName = komponenteName 
            ? `Checkliste: ${komponenteName.name}`
            : `Komponente: ${oldKomponenteId}`;

          const result = await newPool.query(`
            INSERT INTO checklisten (name, typ, items, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `, [checklistName, 'komponenten', JSON.stringify(checklistItems)]);

          const checklistId = result.rows[0].id;

          // Verknüpfe Checkliste mit Komponente
          await newPool.query(`
            UPDATE komponenten 
            SET checkliste_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [checklistId, newKomponenteId]);

          createdCount++;
        }

        if ((createdCount + updatedCount) % 10 === 0) {
          process.stdout.write(`  ✓ ${createdCount + updatedCount} Checklisten verarbeitet...\r`);
        }
      } catch (error: any) {
        console.error(`  ❌ Fehler bei Komponente ${oldKomponenteId}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n✓ ${createdCount} Checklisten erstellt, ${updatedCount} aktualisiert`);
    if (skippedCount > 0) {
      console.log(`  ⚠ ${skippedCount} Komponenten übersprungen`);
    }

    console.log("\n✅ Migration der Checklisten abgeschlossen!");
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

async function getKomponenteMapping(): Promise<KomponenteMapping[]> {
  const mapping: KomponenteMapping[] = [];

  try {
    // Hole alle Komponenten aus der neuen Datenbank
    const newKomponentenResult = await newPool.query(`
      SELECT id, name, artikel_nummer 
      FROM komponenten
    `);

    // Öffne alte Datenbank temporär für Mapping
    const oldDb = new Database(OLD_DB_PATH, { readonly: true });
    
    try {
      const oldKomponenten = oldDb.prepare(`
        SELECT id, name, artikelnummer
        FROM ${OLD_TABLE_KOMPONENTE}
      `).all() as Array<{ id: number; name: string; artikelnummer?: string }>;

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
        let newId: string | undefined;

        if (oldKomponente.name) {
          newId = newKomponentenByName.get(oldKomponente.name.toLowerCase());
        }

        if (!newId && oldKomponente.artikelnummer) {
          newId = newKomponentenByArtikel.get(oldKomponente.artikelnummer.toLowerCase());
        }

        if (newId) {
          mapping.push({
            oldId: oldKomponente.id,
            newId: newId,
          });
        }
      }
    } finally {
      oldDb.close();
    }
  } catch (error: any) {
    console.warn(`  ⚠ Konnte Komponenten-Mapping nicht erstellen: ${error.message}`);
  }

  return mapping;
}

// Hauptfunktion ausführen
if (require.main === module) {
  migrateChecklisten()
    .then(() => {
      console.log("\n✅ Migration abgeschlossen!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration fehlgeschlagen:", error);
      process.exit(1);
    });
}

export { migrateChecklisten };

