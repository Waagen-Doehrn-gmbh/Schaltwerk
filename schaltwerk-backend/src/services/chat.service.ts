import { ChatModel, ChatMessage, ChatMessageWithUser } from "../models/chat.model";
import { CreateChatMessageInput } from "../models/chat.model";

export class ChatService {
  static async getMessageById(id: string): Promise<ChatMessageWithUser | null> {
    return ChatModel.findById(id);
  }

  static async getMessagesByProjekt(
    projektId: string
  ): Promise<ChatMessageWithUser[]> {
    return ChatModel.findByProjekt(projektId);
  }

  static async getMessagesBySchaltschrankNummer(
    schaltschrankNummer: string
  ): Promise<ChatMessageWithUser[]> {
    return ChatModel.findBySchaltschrankNummer(schaltschrankNummer);
  }

  static async createMessage(input: CreateChatMessageInput): Promise<ChatMessage> {
    return ChatModel.create(input);
  }

  static async deleteMessage(id: string): Promise<void> {
    return ChatModel.delete(id);
  }

  static async deleteAllByProjekt(projektId: string): Promise<number> {
    return ChatModel.deleteAllByProjekt(projektId);
  }

  static async markMessagesAsRead(userId: string, projektId: string): Promise<void> {
    return ChatModel.markAsRead(userId, projektId);
  }

  static async getLastReadAt(userId: string, projektId: string): Promise<Date | null> {
    return ChatModel.getLastReadAt(userId, projektId);
  }
}

