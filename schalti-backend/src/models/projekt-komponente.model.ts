import { pool } from "../config/database";

export interface ProjektKomponente {
  id: string;
  projektId: string;
  komponenteId: string;
  status: "abgeschlossen" | "ausstehend";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjektKomponenteInput {
  projektId: string;
  komponenteId: string;
  status?: "abgeschlossen" | "ausstehend";
}

export class ProjektKomponenteModel {
  // Finde Status für eine Komponente in einem Projekt
  static async findByProjektAndKomponente(
    projektId: string,
    komponenteId: string
  ): Promise<ProjektKomponente | null> {
    const result = await pool.query(
      "SELECT * FROM projekt_komponenten WHERE projekt_id = $1 AND komponente_id = $2",
      [projektId, komponenteId]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      projektId: row.projekt_id,
      komponenteId: row.komponente_id,
      status: row.status || "ausstehend",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Finde alle Komponenten-Status für ein Projekt
  static async findByProjekt(projektId: string): Promise<ProjektKomponente[]> {
    const result = await pool.query(
      "SELECT * FROM projekt_komponenten WHERE projekt_id = $1",
      [projektId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      projektId: row.projekt_id,
      komponenteId: row.komponente_id,
      status: row.status || "ausstehend",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // Erstelle oder aktualisiere Status
  static async upsert(
    input: CreateProjektKomponenteInput
  ): Promise<ProjektKomponente> {
    const status = input.status || "ausstehend";
    
    const result = await pool.query(
      `INSERT INTO projekt_komponenten (projekt_id, komponente_id, status, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (projekt_id, komponente_id)
       DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [input.projektId, input.komponenteId, status]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      projektId: row.projekt_id,
      komponenteId: row.komponente_id,
      status: row.status || "ausstehend",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Aktualisiere Status
  static async updateStatus(
    projektId: string,
    komponenteId: string,
    status: "abgeschlossen" | "ausstehend"
  ): Promise<ProjektKomponente> {
    const result = await pool.query(
      `UPDATE projekt_komponenten 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE projekt_id = $2 AND komponente_id = $3
       RETURNING *`,
      [status, projektId, komponenteId]
    );
    
    if (!result.rows[0]) {
      // Falls nicht vorhanden, erstelle neuen Eintrag
      return this.upsert({ projektId, komponenteId, status });
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      projektId: row.projekt_id,
      komponenteId: row.komponente_id,
      status: row.status || "ausstehend",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Lösche Eintrag (wenn Komponente aus Projekt entfernt wird)
  static async delete(projektId: string, komponenteId: string): Promise<void> {
    await pool.query(
      "DELETE FROM projekt_komponenten WHERE projekt_id = $1 AND komponente_id = $2",
      [projektId, komponenteId]
    );
  }
}

