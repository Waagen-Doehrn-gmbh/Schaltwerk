import { ChatModel, ChatMessage, ChatMessageWithUser } from "../models/chat.model";
import { CreateChatMessageInput } from "../models/chat.model";

export class ChatService {
  static async getMessagesByProjekt(
    projektId: string
  ): Promise<ChatMessageWithUser[]> {
    return ChatModel.findByProjekt(projektId);
  }

  static async createMessage(input: CreateChatMessageInput): Promise<ChatMessage> {
    return ChatModel.create(input);
  }

  static async deleteMessage(id: string): Promise<void> {
    return ChatModel.delete(id);
  }
}

