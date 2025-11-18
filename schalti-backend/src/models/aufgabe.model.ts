import { pool } from "../config/database";

export interface Aufgabe {
  id: string;
  name: string;
  checklisteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAufgabeInput {
  name: string;
  checklisteId?: string;
}

export class AufgabeModel {
  static async findAll(): Promise<Aufgabe[]> {
    const result = await pool.query("SELECT * FROM aufgaben ORDER BY name");
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async findById(id: string): Promise<Aufgabe | null> {
    const result = await pool.query("SELECT * FROM aufgaben WHERE id = $1", [
      id,
    ]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByName(name: string): Promise<Aufgabe | null> {
    const result = await pool.query(
      "SELECT * FROM aufgaben WHERE name = $1",
      [name]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(input: CreateAufgabeInput): Promise<Aufgabe> {
    const result = await pool.query(
      `INSERT INTO aufgaben (name, checkliste_id)
       VALUES ($1, $2)
       RETURNING *`,
      [input.name, input.checklisteId || null]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(
    id: string,
    updates: Partial<CreateAufgabeInput>
  ): Promise<Aufgabe> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.checklisteId !== undefined) {
      fields.push(`checkliste_id = $${paramCount++}`);
      values.push(updates.checklisteId || null);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE aufgaben SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      checklisteId: row.checkliste_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM aufgaben WHERE id = $1", [id]);
  }
}

