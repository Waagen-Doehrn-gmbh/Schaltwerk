import { pool } from "../config/database";

export interface ChecklisteItem {
  id: string;
  text: string;
  komponenteId?: string;
  artikelNummer?: string;
}

export interface Checkliste {
  id: string;
  name: string;
  typ: "allgemein" | "komponenten";
  items: ChecklisteItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChecklisteInput {
  name: string;
  typ: "allgemein" | "komponenten";
  items: ChecklisteItem[];
}

export class ChecklisteModel {
  static async findAll(): Promise<Checkliste[]> {
    const result = await pool.query(
      "SELECT * FROM checklisten ORDER BY name"
    );
    return result.rows.map((row) => ({
      id: String(row.id), // Stelle sicher, dass ID ein String ist
      name: row.name,
      typ: row.typ,
      items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async findById(id: string): Promise<Checkliste | null> {
    const result = await pool.query(
      "SELECT * FROM checklisten WHERE id = $1",
      [id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: String(row.id), // Stelle sicher, dass ID ein String ist
      name: row.name,
      typ: row.typ,
      items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByTyp(
    typ: "allgemein" | "komponenten"
  ): Promise<Checkliste[]> {
    const result = await pool.query(
      "SELECT * FROM checklisten WHERE typ = $1 ORDER BY name",
      [typ]
    );
    return result.rows.map((row) => ({
      id: String(row.id), // Stelle sicher, dass ID ein String ist
      name: row.name,
      typ: row.typ,
      items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async create(input: CreateChecklisteInput): Promise<Checkliste> {
    const result = await pool.query(
      `INSERT INTO checklisten (name, typ, items)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.typ, JSON.stringify(input.items)]
    );
    const row = result.rows[0];
    return {
      id: String(row.id), // Stelle sicher, dass ID ein String ist
      name: row.name,
      typ: row.typ,
      items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(
    id: string,
    updates: Partial<CreateChecklisteInput>
  ): Promise<Checkliste> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.typ) {
      fields.push(`typ = $${paramCount++}`);
      values.push(updates.typ);
    }
    if (updates.items) {
      fields.push(`items = $${paramCount++}`);
      values.push(JSON.stringify(updates.items));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE checklisten SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: String(row.id), // Stelle sicher, dass ID ein String ist
      name: row.name,
      typ: row.typ,
      items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM checklisten WHERE id = $1", [id]);
  }
}

