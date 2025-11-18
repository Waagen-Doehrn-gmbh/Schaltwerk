import {
  KomponenteModel,
  Komponente,
} from "../models/komponente.model";
import { CreateKomponenteInput } from "../models/komponente.model";

export class KomponenteService {
  static async getAllKomponenten(): Promise<Komponente[]> {
    return KomponenteModel.findAll();
  }

  static async getKomponenteById(id: string): Promise<Komponente | null> {
    return KomponenteModel.findById(id);
  }

  static async getKomponentenByProjekt(
    projektId: string
  ): Promise<Komponente[]> {
    return KomponenteModel.findByProjekt(projektId);
  }

  static async getKomponentenByStatus(
    status: "abgeschlossen" | "ausstehend"
  ): Promise<Komponente[]> {
    return KomponenteModel.findByStatus(status);
  }

  static async createKomponente(input: CreateKomponenteInput): Promise<Komponente> {
    return KomponenteModel.create(input);
  }

  static async updateKomponente(
    id: string,
    updates: Partial<CreateKomponenteInput>
  ): Promise<Komponente> {
    return KomponenteModel.update(id, updates);
  }

  static async deleteKomponente(id: string): Promise<void> {
    return KomponenteModel.delete(id);
  }
}

