import { pool } from "../config/database";
import { UserPublic } from "./user.model";

export interface Protokoll {
  id: string;
  aufgabe: string;
  details?: string;
  zeitaufwand: number;
  datum: Date;
  userId: string;
  projektId: string;
  abnahmeStatus?: "bestanden" | "verweigert";
  abnahmeTyp?: "technisch" | "endabnahme";
  checklisteStatus?: "abgeschlossen" | "teilabschluss";
  abnahmeCheckliste?: any[];
  abgeschlosseneKomponentenIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtokollWithUser extends Protokoll {
  user?: UserPublic;
}

export interface CreateProtokollInput {
  aufgabe: string;
  details?: string;
  zeitaufwand: number;
  datum?: Date;
  userId: string;
  projektId: string;
  abnahmeStatus?: "bestanden" | "verweigert";
  abnahmeTyp?: "technisch" | "endabnahme";
  checklisteStatus?: "abgeschlossen" | "teilabschluss";
  abnahmeCheckliste?: any[];
  abgeschlosseneKomponentenIds?: string[];
}

export class ProtokollModel {
  static async findAll(): Promise<ProtokollWithUser[]> {
    const result = await pool.query(
      `SELECT p.*, 
       json_build_object(
         'id', u.id,
         'email', u.email,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM protokolle p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.datum DESC, p.created_at DESC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      aufgabe: row.aufgabe,
      details: row.details,
      zeitaufwand: parseFloat(row.zeitaufwand),
      datum: row.datum,
      userId: row.user_id,
      projektId: row.projekt_id,
      abnahmeStatus: row.abnahme_status,
      abnahmeTyp: row.abnahme_typ,
      checklisteStatus: row.checkliste_status,
      abnahmeCheckliste: row.abnahme_checkliste,
      abgeschlosseneKomponentenIds: row.abgeschlossene_komponenten_ids,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user,
    }));
  }

  static async findById(id: string): Promise<ProtokollWithUser | null> {
    const result = await pool.query(
      `SELECT p.*, 
       json_build_object(
         'id', u.id,
         'email', u.email,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM protokolle p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      aufgabe: row.aufgabe,
      details: row.details,
      zeitaufwand: parseFloat(row.zeitaufwand),
      datum: row.datum,
      userId: row.user_id,
      projektId: row.projekt_id,
      abnahmeStatus: row.abnahme_status,
      abnahmeTyp: row.abnahme_typ,
      checklisteStatus: row.checkliste_status,
      abnahmeCheckliste: row.abnahme_checkliste,
      abgeschlosseneKomponentenIds: row.abgeschlossene_komponenten_ids,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user,
    };
  }

  static async findByProjekt(projektId: string): Promise<ProtokollWithUser[]> {
    const result = await pool.query(
      `SELECT p.*, 
       json_build_object(
         'id', u.id,
         'email', u.email,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM protokolle p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.projekt_id = $1
       ORDER BY p.datum DESC, p.created_at DESC`,
      [projektId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      aufgabe: row.aufgabe,
      details: row.details,
      zeitaufwand: parseFloat(row.zeitaufwand),
      datum: row.datum,
      userId: row.user_id,
      projektId: row.projekt_id,
      abnahmeStatus: row.abnahme_status,
      abnahmeTyp: row.abnahme_typ,
      checklisteStatus: row.checkliste_status,
      abnahmeCheckliste: row.abnahme_checkliste,
      abgeschlosseneKomponentenIds: row.abgeschlossene_komponenten_ids,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user,
    }));
  }

  static async create(input: CreateProtokollInput): Promise<Protokoll> {
    const result = await pool.query(
      `INSERT INTO protokolle (
        aufgabe, details, zeitaufwand, datum, user_id, projekt_id,
        abnahme_status, abnahme_typ, checkliste_status,
        abnahme_checkliste, abgeschlossene_komponenten_ids
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.aufgabe,
        input.details || null,
        input.zeitaufwand,
        input.datum || new Date(),
        input.userId,
        input.projektId,
        input.abnahmeStatus || null,
        input.abnahmeTyp || null,
        input.checklisteStatus || null,
        input.abnahmeCheckliste ? JSON.stringify(input.abnahmeCheckliste) : null,
        input.abgeschlosseneKomponentenIds || null,
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      aufgabe: row.aufgabe,
      details: row.details,
      zeitaufwand: parseFloat(row.zeitaufwand),
      datum: row.datum,
      userId: row.user_id,
      projektId: row.projekt_id,
      abnahmeStatus: row.abnahme_status,
      abnahmeTyp: row.abnahme_typ,
      checklisteStatus: row.checkliste_status,
      abnahmeCheckliste: row.abnahme_checkliste,
      abgeschlosseneKomponentenIds: row.abgeschlossene_komponenten_ids,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(
    id: string,
    updates: Partial<CreateProtokollInput>
  ): Promise<Protokoll> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.aufgabe) {
      fields.push(`aufgabe = $${paramCount++}`);
      values.push(updates.aufgabe);
    }
    if (updates.details !== undefined) {
      fields.push(`details = $${paramCount++}`);
      values.push(updates.details || null);
    }
    if (updates.zeitaufwand !== undefined) {
      fields.push(`zeitaufwand = $${paramCount++}`);
      values.push(updates.zeitaufwand);
    }
    if (updates.datum) {
      fields.push(`datum = $${paramCount++}`);
      values.push(updates.datum);
    }
    if (updates.abnahmeStatus !== undefined) {
      fields.push(`abnahme_status = $${paramCount++}`);
      values.push(updates.abnahmeStatus || null);
    }
    if (updates.abnahmeTyp !== undefined) {
      fields.push(`abnahme_typ = $${paramCount++}`);
      values.push(updates.abnahmeTyp || null);
    }
    if (updates.checklisteStatus !== undefined) {
      fields.push(`checkliste_status = $${paramCount++}`);
      values.push(updates.checklisteStatus || null);
    }
    if (updates.abnahmeCheckliste !== undefined) {
      fields.push(`abnahme_checkliste = $${paramCount++}`);
      values.push(
        updates.abnahmeCheckliste
          ? JSON.stringify(updates.abnahmeCheckliste)
          : null
      );
    }
    if (updates.abgeschlosseneKomponentenIds !== undefined) {
      fields.push(`abgeschlossene_komponenten_ids = $${paramCount++}`);
      values.push(updates.abgeschlosseneKomponentenIds || null);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE protokolle SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: row.id,
      aufgabe: row.aufgabe,
      details: row.details,
      zeitaufwand: parseFloat(row.zeitaufwand),
      datum: row.datum,
      userId: row.user_id,
      projektId: row.projekt_id,
      abnahmeStatus: row.abnahme_status,
      abnahmeTyp: row.abnahme_typ,
      checklisteStatus: row.checkliste_status,
      abnahmeCheckliste: row.abnahme_checkliste,
      abgeschlosseneKomponentenIds: row.abgeschlossene_komponenten_ids,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM protokolle WHERE id = $1", [id]);
  }
}

