import { pool } from "../config/database";

export interface Projekt {
  id: string;
  name: string;
  standort: string;
  status: "planung" | "in_bearbeitung" | "abgeschlossen";
  schaltschrankNummer?: string;
  komponentenIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjektWithStats extends Projekt {
  stats: {
    stunden: number;
    eintraege: number;
    komponenten: number;
    gesamtKomponenten: number;
  };
}

export interface CreateProjektInput {
  name: string;
  standort: string;
  status: "planung" | "in_bearbeitung" | "abgeschlossen";
  schaltschrankNummer?: string;
  komponentenIds?: string[];
}

export class ProjektModel {
  static async findAll(): Promise<Projekt[]> {
    const result = await pool.query(
      "SELECT * FROM projekte ORDER BY created_at DESC"
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      standort: row.standort,
      status: row.status,
      schaltschrankNummer: row.schaltschrank_nummer,
      komponentenIds: row.komponenten_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async findById(id: string): Promise<Projekt | null> {
    const result = await pool.query("SELECT * FROM projekte WHERE id = $1", [
      id,
    ]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      standort: row.standort,
      status: row.status,
      schaltschrankNummer: row.schaltschrank_nummer,
      komponentenIds: row.komponenten_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByStatus(
    status: "planung" | "in_bearbeitung" | "abgeschlossen"
  ): Promise<Projekt[]> {
    const result = await pool.query(
      "SELECT * FROM projekte WHERE status = $1 ORDER BY created_at DESC",
      [status]
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      standort: row.standort,
      status: row.status,
      schaltschrankNummer: row.schaltschrank_nummer,
      komponentenIds: row.komponenten_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async create(input: CreateProjektInput): Promise<Projekt> {
    const result = await pool.query(
      `INSERT INTO projekte (name, standort, status, schaltschrank_nummer, komponenten_ids)
       VALUES ($1, $2, $3, $4, $5::uuid[])
       RETURNING *`,
      [
        input.name, 
        input.standort, 
        input.status, 
        input.schaltschrankNummer || null,
        input.komponentenIds || []
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      standort: row.standort,
      status: row.status,
      schaltschrankNummer: row.schaltschrank_nummer,
      komponentenIds: row.komponenten_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(
    id: string,
    updates: Partial<CreateProjektInput>
  ): Promise<Projekt> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.standort) {
      fields.push(`standort = $${paramCount++}`);
      values.push(updates.standort);
    }
    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.schaltschrankNummer !== undefined) {
      fields.push(`schaltschrank_nummer = $${paramCount++}`);
      values.push(updates.schaltschrankNummer || null);
    }
    if (updates.komponentenIds !== undefined) {
      fields.push(`komponenten_ids = $${paramCount++}::uuid[]`);
      values.push(updates.komponentenIds || []);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projekte SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      standort: row.standort,
      status: row.status,
      schaltschrankNummer: row.schaltschrank_nummer,
      komponentenIds: row.komponenten_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM projekte WHERE id = $1", [id]);
  }

  static async getStats(projektId: string): Promise<{
    stunden: number;
    eintraege: number;
    komponenten: number;
    gesamtKomponenten: number;
  }> {
    // Stunden und Einträge aus Protokollen
    const protokollResult = await pool.query(
      `SELECT 
        COALESCE(SUM(zeitaufwand), 0) as stunden,
        COUNT(*) as eintraege
       FROM protokolle
       WHERE projekt_id = $1`,
      [projektId]
    );

    // Hole komponenten_ids aus dem Projekt
    const projektResult = await pool.query(
      `SELECT komponenten_ids FROM projekte WHERE id = $1`,
      [projektId]
    );
    const komponentenIds = projektResult.rows[0]?.komponenten_ids || [];

    // Komponenten-Statistiken basierend auf komponenten_ids
    let komponenten = 0;
    let gesamtKomponenten = 0;
    
    if (komponentenIds.length > 0) {
      const komponentenResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'abgeschlossen') as komponenten,
          COUNT(*) as gesamt_komponenten
         FROM komponenten
         WHERE id = ANY($1::uuid[])`,
        [komponentenIds]
      );
      komponenten = parseInt(komponentenResult.rows[0].komponenten) || 0;
      gesamtKomponenten = parseInt(komponentenResult.rows[0].gesamt_komponenten) || 0;
    } else {
      // Fallback: Wenn keine komponenten_ids, verwende projekt_id (für alte Daten)
      const komponentenResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'abgeschlossen') as komponenten,
          COUNT(*) as gesamt_komponenten
         FROM komponenten
         WHERE projekt_id = $1`,
        [projektId]
      );
      komponenten = parseInt(komponentenResult.rows[0].komponenten) || 0;
      gesamtKomponenten = parseInt(komponentenResult.rows[0].gesamt_komponenten) || 0;
    }

    return {
      stunden: parseFloat(protokollResult.rows[0].stunden) || 0,
      eintraege: parseInt(protokollResult.rows[0].eintraege) || 0,
      komponenten,
      gesamtKomponenten,
    };
  }

  static async getWithStats(id: string): Promise<ProjektWithStats | null> {
    const projekt = await this.findById(id);
    if (!projekt) return null;

    const stats = await this.getStats(id);
    // Stelle sicher, dass komponentenIds zurückgegeben wird
    return { ...projekt, komponentenIds: projekt.komponentenIds || [], stats };
  }
}

