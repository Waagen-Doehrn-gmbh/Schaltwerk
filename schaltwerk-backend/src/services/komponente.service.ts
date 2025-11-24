import {
  KomponenteModel,
  Komponente,
} from "../models/komponente.model";
import { CreateKomponenteInput } from "../models/komponente.model";
import { ProjektKomponenteModel, ProjektKomponente } from "../models/projekt-komponente.model";

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

  // Projekt-spezifische Status-Operationen
  static async updateKomponenteStatusInProjekt(
    projektId: string,
    komponenteId: string,
    status: "abgeschlossen" | "ausstehend"
  ): Promise<ProjektKomponente> {
    return ProjektKomponenteModel.updateStatus(projektId, komponenteId, status);
  }

  static async getKomponenteStatusInProjekt(
    projektId: string,
    komponenteId: string
  ): Promise<"abgeschlossen" | "ausstehend" | null> {
    const projektKomponente = await ProjektKomponenteModel.findByProjektAndKomponente(
      projektId,
      komponenteId
    );
    return projektKomponente?.status || null;
  }
}

