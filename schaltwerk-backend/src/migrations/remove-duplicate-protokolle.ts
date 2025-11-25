import { pool } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

async function removeDuplicateProtokolle() {
  try {
    console.log("🔄 Starte Entfernung von doppelten Protokollen...\n");

    // Finde Duplikate basierend auf Inhalt
    console.log("🔍 Suche nach Duplikaten...");
    const duplicatesResult = await pool.query(`
      SELECT 
        aufgabe,
        datum,
        zeitaufwand,
        COALESCE(details, '') as details,
        projekt_id,
        COUNT(*) as anzahl,
        array_agg(id ORDER BY created_at) as ids
      FROM protokolle
      GROUP BY aufgabe, datum, zeitaufwand, COALESCE(details, ''), projekt_id
      HAVING COUNT(*) > 1
      ORDER BY anzahl DESC
    `);

    console.log(`  📊 Gefunden: ${duplicatesResult.rows.length} Gruppen mit Duplikaten\n`);

    if (duplicatesResult.rows.length === 0) {
      console.log("✓ Keine Duplikate gefunden.");
      return;
    }

    let totalRemoved = 0;

    for (const duplicate of duplicatesResult.rows) {
      const ids = duplicate.ids as string[];
      // Behalte das erste (älteste) Protokoll, entferne die restlichen
      const keepId = ids[0];
      const removeIds = ids.slice(1);

      console.log(`  📋 "${duplicate.aufgabe}" (${duplicate.datum.toISOString().split('T')[0]}):`);
      console.log(`     Behalte: ${keepId}`);
      console.log(`     Entferne: ${removeIds.length} Duplikat(e)`);

      // Entferne die Duplikate
      for (const id of removeIds) {
        await pool.query("DELETE FROM protokolle WHERE id = $1", [id]);
        totalRemoved++;
      }
    }

    console.log(`\n✓ ${totalRemoved} doppelte Protokolle entfernt`);
    console.log("✅ Bereinigung abgeschlossen!");
  } catch (error: any) {
    console.error("❌ Fehler bei der Bereinigung:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Hauptfunktion ausführen
if (require.main === module) {
  removeDuplicateProtokolle()
    .then(() => {
      console.log("\n✅ Bereinigung abgeschlossen!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Bereinigung fehlgeschlagen:", error);
      process.exit(1);
    });
}

export { removeDuplicateProtokolle };

