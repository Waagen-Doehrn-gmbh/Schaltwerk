import { ProjektModel, Projekt, ProjektWithStats } from "../models/projekt.model";
import { CreateProjektInput } from "../models/projekt.model";

export class ProjektService {
  static async getAllProjekte(): Promise<Projekt[]> {
    return ProjektModel.findAll();
  }

  static async getProjektById(id: string): Promise<ProjektWithStats | null> {
    return ProjektModel.getWithStats(id);
  }

  static async getProjekteByStatus(
    status: "planung" | "in_bearbeitung" | "abgeschlossen"
  ): Promise<Projekt[]> {
    return ProjektModel.findByStatus(status);
  }

  static async createProjekt(input: CreateProjektInput): Promise<Projekt> {
    return ProjektModel.create(input);
  }

  static async updateProjekt(
    id: string,
    updates: Partial<CreateProjektInput>
  ): Promise<Projekt> {
    return ProjektModel.update(id, updates);
  }

  static async deleteProjekt(id: string): Promise<void> {
    return ProjektModel.delete(id);
  }
}

