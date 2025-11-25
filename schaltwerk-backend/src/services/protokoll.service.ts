import {
  ProtokollModel,
  Protokoll,
  ProtokollWithUser,
} from "../models/protokoll.model";
import { CreateProtokollInput } from "../models/protokoll.model";
import { KomponenteModel } from "../models/komponente.model";

export class ProtokollService {
  static async getAllProtokolle(): Promise<ProtokollWithUser[]> {
    return ProtokollModel.findAll();
  }

  static async getProtokollById(id: string): Promise<ProtokollWithUser | null> {
    return ProtokollModel.findById(id);
  }

  static async getProtokolleByProjekt(
    projektId: string
  ): Promise<ProtokollWithUser[]> {
    return ProtokollModel.findByProjekt(projektId);
  }

  static async getProtokolleBySchaltschrankNummer(
    schaltschrankNummer: string
  ): Promise<ProtokollWithUser[]> {
    return ProtokollModel.findBySchaltschrankNummer(schaltschrankNummer);
  }

  static async createProtokoll(
    input: CreateProtokollInput
  ): Promise<Protokoll> {
    // Wenn Komponenten über Checkliste abgeschlossen wurden, aktualisiere deren Status
    if (input.abgeschlosseneKomponentenIds && input.abgeschlosseneKomponentenIds.length > 0) {
      for (const komponenteId of input.abgeschlosseneKomponentenIds) {
        await KomponenteModel.update(komponenteId, {
          status: "abgeschlossen",
        });
      }
    }

    return ProtokollModel.create(input);
  }

  static async updateProtokoll(
    id: string,
    updates: Partial<CreateProtokollInput>
  ): Promise<Protokoll> {
    // Wenn Komponenten aktualisiert wurden, aktualisiere deren Status
    if (updates.abgeschlosseneKomponentenIds) {
      for (const komponenteId of updates.abgeschlosseneKomponentenIds) {
        await KomponenteModel.update(komponenteId, {
          status: "abgeschlossen",
        });
      }
    }

    return ProtokollModel.update(id, updates);
  }

  static async deleteProtokoll(id: string): Promise<void> {
    return ProtokollModel.delete(id);
  }
}

