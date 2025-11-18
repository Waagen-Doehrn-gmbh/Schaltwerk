"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Checkliste } from "@/types";
import { checklisteApi } from "@/lib/api";
import {
  STANDARD_ABNAHME_CHECKLISTE,
  ENDABNAHME_CHECKLISTE,
} from "@/components/protokoll/AbnahmeCheckliste";

// Initiale Checklisten (Fallback)
const initialChecklisten: Checkliste[] = [
  {
    id: "checkliste-1",
    name: "Standard Technische Abnahme",
    typ: "technisch",
    items: STANDARD_ABNAHME_CHECKLISTE,
  },
  {
    id: "checkliste-2",
    name: "Standard Endabnahme",
    typ: "endabnahme",
    items: ENDABNAHME_CHECKLISTE,
  },
];

interface ChecklistenContextType {
  checklisten: Checkliste[];
  setChecklisten: (checklisten: Checkliste[]) => void;
  addCheckliste: (checkliste: Checkliste) => void;
  updateCheckliste: (id: string, checkliste: Checkliste) => void;
  deleteCheckliste: (id: string) => void;
  isLoading: boolean;
  refreshChecklisten: () => Promise<void>;
}

const ChecklistenContext = createContext<ChecklistenContextType | undefined>(undefined);

export function ChecklistenProvider({ children }: { children: ReactNode }) {
  const [checklisten, setChecklisten] = useState<Checkliste[]>(initialChecklisten);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Checklisten aus der API
  const loadChecklisten = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Lade Checklisten aus API...");
      const apiChecklisten = await checklisteApi.getAll();
      console.log("✅ Checklisten aus API geladen:", apiChecklisten.length, "Checklisten");
      console.log("✅ Checklisten-Details aus API:", JSON.stringify(apiChecklisten.map(c => ({ id: c.id, name: c.name })), null, 2));
      
      // Kombiniere API-Checklisten mit initialen Checklisten
      // API-Checklisten haben Vorrang (überschreiben initiale mit gleicher ID)
      const combinedChecklisten: Checkliste[] = [...initialChecklisten];
      
      apiChecklisten.forEach((apiCheckliste) => {
        const existingIndex = combinedChecklisten.findIndex((c) => c.id === apiCheckliste.id);
        if (existingIndex >= 0) {
          // Überschreibe initiale Checkliste
          console.log(`  🔄 Überschreibe Checkliste: ${apiCheckliste.id} (${apiCheckliste.name})`);
          combinedChecklisten[existingIndex] = apiCheckliste;
        } else {
          // Füge neue Checkliste hinzu
          console.log(`  ➕ Füge neue Checkliste hinzu: ${apiCheckliste.id} (${apiCheckliste.name})`);
          combinedChecklisten.push(apiCheckliste);
        }
      });
      
      console.log("📋 Finale Checklisten im Context:", combinedChecklisten.length, "Checklisten");
      console.log("📋 Finale Checklisten-Details:", JSON.stringify(combinedChecklisten.map(c => ({ id: c.id, name: c.name })), null, 2));
      setChecklisten(combinedChecklisten);
    } catch (err: any) {
      console.error("❌ Fehler beim Laden der Checklisten:", err);
      // Bei Fehler: Verwende initiale Checklisten
      setChecklisten(initialChecklisten);
    } finally {
      setIsLoading(false);
    }
  };

  // Lade Checklisten beim Mount
  useEffect(() => {
    console.log("🚀 ChecklistenProvider: Starte Checklisten-Laden...");
    loadChecklisten();
  }, []);

  // Refresh-Funktion für manuelles Neuladen
  const refreshChecklisten = async () => {
    await loadChecklisten();
  };

  const addCheckliste = (checkliste: Checkliste) => {
    setChecklisten((prev) => [...prev, checkliste]);
  };

  const updateCheckliste = (id: string, checkliste: Checkliste) => {
    setChecklisten((prev) =>
      prev.map((c) => (c.id === id ? checkliste : c))
    );
  };

  const deleteCheckliste = (id: string) => {
    setChecklisten((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <ChecklistenContext.Provider
      value={{
        checklisten,
        setChecklisten,
        addCheckliste,
        updateCheckliste,
        deleteCheckliste,
        isLoading,
        refreshChecklisten,
      }}
    >
      {children}
    </ChecklistenContext.Provider>
  );
}

export function useChecklisten() {
  const context = useContext(ChecklistenContext);
  if (context === undefined) {
    throw new Error("useChecklisten must be used within a ChecklistenProvider");
  }
  return context;
}

// Optional hook für Komponenten außerhalb des Providers
export function useChecklistenOptional() {
  const context = useContext(ChecklistenContext);
  return context; // Kann undefined sein
}

