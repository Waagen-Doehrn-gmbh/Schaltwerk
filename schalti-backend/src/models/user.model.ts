import { pool } from "../config/database";
import { hashPassword, comparePassword } from "../utils/password.util";

export type UserRole = "admin" | "monteur" | "technische_abnahme" | "endabnahme";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  initialen: string;
  rolle: UserRole;
  berechtigungen?: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  initialen: string;
  rolle: UserRole;
  berechtigungen?: string[];
  avatarUrl?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  initialen: string;
  rolle: UserRole;
  berechtigungen?: string[];
  avatarUrl?: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByName(name: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT * FROM users WHERE name = $1",
      [name]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findAll(): Promise<User[]> {
    const result = await pool.query("SELECT * FROM users ORDER BY name");
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await hashPassword(input.password);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, initialen, rolle, berechtigungen, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.email,
        passwordHash,
        input.name,
        input.initialen,
        input.rolle,
        JSON.stringify(input.berechtigungen || []),
        input.avatarUrl || null,
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async update(id: string, updates: Partial<CreateUserInput>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.initialen) {
      fields.push(`initialen = $${paramCount++}`);
      values.push(updates.initialen);
    }
    if (updates.rolle) {
      fields.push(`rolle = $${paramCount++}`);
      values.push(updates.rolle);
    }
    if (updates.berechtigungen !== undefined) {
      fields.push(`berechtigungen = $${paramCount++}`);
      values.push(JSON.stringify(updates.berechtigungen));
    }
    if (updates.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(updates.avatarUrl);
    }
    if (updates.password) {
      const passwordHash = await hashPassword(updates.password);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      initialen: row.initialen,
      rolle: row.rolle,
      berechtigungen: row.berechtigungen || [],
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePassword(password, user.passwordHash);
  }

  static toPublic(user: User): UserPublic {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}

