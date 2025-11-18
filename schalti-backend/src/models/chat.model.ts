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
  static async findByProjekt(
    projektId: string
  ): Promise<ChatMessageWithUser[]> {
    const result = await pool.query(
      `SELECT c.*, 
       json_build_object(
         'id', u.id,
         'email', u.email,
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
}

