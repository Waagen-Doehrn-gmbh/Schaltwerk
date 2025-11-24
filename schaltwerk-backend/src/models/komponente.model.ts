import { pool } from "../config/database";

export interface Komponente {
  id: string;
  name: string;
  artikelNummer: string;
  status: "abgeschlossen" | "ausstehend" | null;
  projektId: string | null;
  checklisteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKomponenteInput {
  name: string;
  artikelNummer: string;
  status?: "abgeschlossen" | "ausstehend";
  projektId?: string;
  checklisteId?: string;
}

export class KomponenteModel {
  static async findAll(): Promise<Komponente[]> {
    const result = await pool.query(
      "SELECT * FROM komponenten ORDER BY name"
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async findById(id: string): Promise<Komponente | null> {
    const result = await pool.query("SELECT * FROM komponenten WHERE id = $1", [
      id,
    ]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByProjekt(projektId: string): Promise<Komponente[]> {
    const result = await pool.query(
      "SELECT * FROM komponenten WHERE projekt_id = $1 ORDER BY name",
      [projektId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async findByStatus(
    status: "abgeschlossen" | "ausstehend"
  ): Promise<Komponente[]> {
    const result = await pool.query(
      "SELECT * FROM komponenten WHERE status = $1 ORDER BY name",
      [status]
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async create(input: CreateKomponenteInput): Promise<Komponente> {
    // Komponenten können ohne Projekt erstellt werden (werden später Projekten zugeordnet)
    const projektId = input.projektId && input.projektId !== "" ? input.projektId : null;
    // Status ist optional, Standard ist "ausstehend"
    const status = input.status || "ausstehend";
    
    const result = await pool.query(
      `INSERT INTO komponenten (name, artikel_nummer, status, projekt_id, checkliste_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.name,
        input.artikelNummer,
        status,
        projektId,
        input.checklisteId || null,
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(
    id: string,
    updates: Partial<CreateKomponenteInput>
  ): Promise<Komponente> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.artikelNummer) {
      fields.push(`artikel_nummer = $${paramCount++}`);
      values.push(updates.artikelNummer);
    }
    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.checklisteId !== undefined) {
      fields.push(`checkliste_id = $${paramCount++}`);
      values.push(updates.checklisteId || null);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE komponenten SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      artikelNummer: row.artikel_nummer,
      status: row.status || "ausstehend",
      projektId: row.projekt_id,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM komponenten WHERE id = $1", [id]);
  }
}

