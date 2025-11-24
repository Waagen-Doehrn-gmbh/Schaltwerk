import { pool } from "../config/database";

interface KomponenteData {
  name: string;
  artikelNummer: string;
}

const neueKomponenten: KomponenteData[] = [
  // Aus Bild 1 (22 Komponenten)
  { name: "2 x Heizung 400W", artikelNummer: "13.AXL0.0400.1101" },
  { name: "Bondrucker", artikelNummer: "XEWLTSP743USB" },
  { name: "Box-PC", artikelNummer: "XAND-PC1" },
  { name: "Funk Empfänger", artikelNummer: "XU47" },
  { name: "Heizung 400W", artikelNummer: "13.AXL0.0400.1101" },
  { name: "IT1", artikelNummer: "XIT1FER015-SYS-EU-D" },
  { name: "IT4000E", artikelNummer: "X14SYS001" },
  { name: "IT8000E", artikelNummer: "Y18SYS001-SYS-EU-D" },
  { name: "Klimaanlage", artikelNummer: "20.INSX.AC05.0101" },
  { name: "Kyocera PA4500x", artikelNummer: "XHDT-3050DN" },
  { name: "Lüfter Schwarz", artikelNummer: "20.INDX.F023.0301" },
  { name: "Lüfter Weiß", artikelNummer: "20.INDX.F023.0101" },
  { name: "Monitoring", artikelNummer: "4711" },
  { name: "Moxa 5232", artikelNummer: "XU49" },
  { name: "Nullstelltaster", artikelNummer: "X00090" },
  { name: "POE Injektor", artikelNummer: "XTEL-20-9596" },
  { name: "QR-Code-Scanner", artikelNummer: "XBC90832" },
  { name: "Relaiskopplung", artikelNummer: "X50REL328-D" },
  { name: "Rohrleuchte außen", artikelNummer: "19.PX25.P061.0008" },
  { name: "Sprechstelle", artikelNummer: "XTEL-20-2" },
  { name: "Switch", artikelNummer: "X00104" },
  
  // Aus Bild 2 (5 Komponenten)
  { name: "Thermostat Heizen", artikelNummer: "13.SETX.XXX1.1100" },
  { name: "Thermostat Kühlen", artikelNummer: "13.SETX.XXX6.1100" },
  { name: "Touch 10,4", artikelNummer: "XAND-TOUCH10ZOLL" },
  { name: "Touch 15,6", artikelNummer: "XAND-TOUCH15ZOLL" },
  { name: "Zusatzkasette Drucker", artikelNummer: "XHDT-6049DN" },
];

async function resetKomponenten() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Lösche alle Komponenten
    console.log("🗑️  Lösche alle bestehenden Komponenten...");
    await client.query("DELETE FROM komponenten");
    console.log("✓ Alle Komponenten gelöscht");
    
    // Erstelle neue Komponenten
    console.log(`📦 Erstelle ${neueKomponenten.length} neue Komponenten...`);
    for (const komponente of neueKomponenten) {
      await client.query(
        `INSERT INTO komponenten (name, artikel_nummer, status, projekt_id)
         VALUES ($1, $2, $3, $4)`,
        [komponente.name, komponente.artikelNummer, "ausstehend", null]
      );
      console.log(`  ✓ ${komponente.name} (${komponente.artikelNummer})`);
    }
    
    await client.query("COMMIT");
    console.log(`\n✅ Erfolgreich ${neueKomponenten.length} Komponenten erstellt!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Fehler beim Zurücksetzen der Komponenten:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetKomponenten().catch((error) => {
  console.error("Error resetting components:", error);
  process.exit(1);
});

