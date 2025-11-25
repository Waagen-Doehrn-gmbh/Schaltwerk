import { pool } from "../config/database";
import { UserPublic } from "./user.model";

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  projektId: string;
  imageUrl?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface ChatMessageWithUser extends ChatMessage {
  user?: UserPublic;
}

export interface CreateChatMessageInput {
  text: string;
  userId: string;
  projektId: string;
  imageUrl?: string;
}

export class ChatModel {
  static async findById(id: string): Promise<ChatMessageWithUser | null> {
    const result = await pool.query(
      `SELECT c.*, 
       json_build_object(
         'id', u.id,
         'username', u.username,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM chat_messages c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      text: row.text,
      userId: row.user_id,
      projektId: row.projekt_id,
      imageUrl: row.image_url,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      user: row.user,
    };
  }

  static async findByProjekt(
    projektId: string
  ): Promise<ChatMessageWithUser[]> {
    const result = await pool.query(
      `SELECT c.*, 
       json_build_object(
         'id', u.id,
         'username', u.username,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM chat_messages c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.projekt_id = $1
       ORDER BY c.timestamp ASC`,
      [projektId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      text: row.text,
      userId: row.user_id,
      projektId: row.projekt_id,
      imageUrl: row.image_url,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      user: row.user,
    }));
  }

  static async findBySchaltschrankNummer(schaltschrankNummer: string): Promise<ChatMessageWithUser[]> {
    const result = await pool.query(
      `SELECT c.*, 
       json_build_object(
         'id', u.id,
         'username', u.username,
         'name', u.name,
         'initialen', u.initialen,
         'rolle', u.rolle,
         'berechtigungen', u.berechtigungen,
         'avatarUrl', u.avatar_url
       ) as user
       FROM chat_messages c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN projekte pr ON c.projekt_id = pr.id
       WHERE pr.schaltschrank_nummer = $1
       ORDER BY c.timestamp ASC`,
      [schaltschrankNummer]
    );
    return result.rows.map((row) => ({
      id: row.id,
      text: row.text,
      userId: row.user_id,
      projektId: row.projekt_id,
      imageUrl: row.image_url,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      user: row.user,
    }));
  }

  static async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const result = await pool.query(
      `INSERT INTO chat_messages (text, user_id, projekt_id, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.text, input.userId, input.projektId, input.imageUrl || null]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      text: row.text,
      userId: row.user_id,
      projektId: row.projekt_id,
      imageUrl: row.image_url,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    };
  }

  static async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM chat_messages WHERE id = $1", [id]);
  }

  static async deleteAllByProjekt(projektId: string): Promise<number> {
    const result = await pool.query(
      "DELETE FROM chat_messages WHERE projekt_id = $1",
      [projektId]
    );
    return result.rowCount || 0;
  }

  static async markAsRead(userId: string, projektId: string): Promise<void> {
    await pool.query(
      `INSERT INTO chat_message_reads (user_id, projekt_id, last_read_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, projekt_id) 
       DO UPDATE SET last_read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
      [userId, projektId]
    );
  }

  static async getLastReadAt(userId: string, projektId: string): Promise<Date | null> {
    const result = await pool.query(
      `SELECT last_read_at FROM chat_message_reads 
       WHERE user_id = $1 AND projekt_id = $2`,
      [userId, projektId]
    );
    return result.rows[0]?.last_read_at || null;
  }
}

