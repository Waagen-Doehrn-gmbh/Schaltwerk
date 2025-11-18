import {
  ChecklisteModel,
  Checkliste,
} from "../models/checkliste.model";
import { CreateChecklisteInput } from "../models/checkliste.model";

export class ChecklisteService {
  static async getAllChecklisten(): Promise<Checkliste[]> {
    return ChecklisteModel.findAll();
  }

  static async getChecklisteById(id: string): Promise<Checkliste | null> {
    return ChecklisteModel.findById(id);
  }

  static async getChecklistenByTyp(
    typ: "allgemein" | "komponenten"
  ): Promise<Checkliste[]> {
    return ChecklisteModel.findByTyp(typ);
  }

  static async createCheckliste(input: CreateChecklisteInput): Promise<Checkliste> {
    return ChecklisteModel.create(input);
  }

  static async updateCheckliste(
    id: string,
    updates: Partial<CreateChecklisteInput>
  ): Promise<Checkliste> {
    return ChecklisteModel.update(id, updates);
  }

  static async deleteCheckliste(id: string): Promise<void> {
    return ChecklisteModel.delete(id);
  }
}

