import { AufgabeModel, Aufgabe } from "../models/aufgabe.model";
import { CreateAufgabeInput } from "../models/aufgabe.model";

export class AufgabeService {
  static async getAllAufgaben(): Promise<Aufgabe[]> {
    return AufgabeModel.findAll();
  }

  static async getAufgabeById(id: string): Promise<Aufgabe | null> {
    return AufgabeModel.findById(id);
  }

  static async getAufgabeByName(name: string): Promise<Aufgabe | null> {
    return AufgabeModel.findByName(name);
  }

  static async createAufgabe(input: CreateAufgabeInput): Promise<Aufgabe> {
    return AufgabeModel.create(input);
  }

  static async updateAufgabe(
    id: string,
    updates: Partial<CreateAufgabeInput>
  ): Promise<Aufgabe> {
    return AufgabeModel.update(id, updates);
  }

  static async deleteAufgabe(id: string): Promise<void> {
    return AufgabeModel.delete(id);
  }
}

