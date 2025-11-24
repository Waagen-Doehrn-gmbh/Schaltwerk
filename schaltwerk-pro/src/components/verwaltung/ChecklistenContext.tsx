"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Checkliste } from "@/types";
import { checklisteApi } from "@/lib/api";
import {
  STANDARD_ABNAHME_CHECKLISTE,
  ENDABNAHME_CHECKLISTE,
} from "@/components/protokoll/AbnahmeCheckliste";
import {
  getDeletedFallbackChecklisten,
  markFallbackChecklisteAsDeleted,
} from "@/lib/checklisten-fallback";

// Initiale Checklisten (Fallback)
const initialChecklisten: Checkliste[] = [
  {
    id: "checkliste-1",
    name: "Standard Technische Abnahme",
    typ: "allgemein",
    items: STANDARD_ABNAHME_CHECKLISTE,
  },
  {
    id: "checkliste-2",
    name: "Standard Endabnahme",
    typ: "allgemein",
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
      
      // Starte mit API-Checklisten
      const combinedChecklisten: Checkliste[] = [...apiChecklisten];
      
      // Lade gelöschte Fallback-Checklisten
      const deletedFallbackIds = getDeletedFallbackChecklisten();
      
      // Füge Fallback-Checklisten nur hinzu, wenn:
      // 1. Keine entsprechende Checkliste in der API existiert
      // 2. Die Fallback-Checkliste nicht vom Benutzer gelöscht wurde
      initialChecklisten.forEach((fallbackCheckliste) => {
        const existsInApi = apiChecklisten.some(
          (apiCheckliste) => 
            apiCheckliste.name === fallbackCheckliste.name && 
            apiCheckliste.typ === fallbackCheckliste.typ
        );
        
        const wasDeleted = deletedFallbackIds.includes(fallbackCheckliste.id);
        
        if (!existsInApi && !wasDeleted) {
          console.log(`  ➕ Füge Fallback-Checkliste hinzu: ${fallbackCheckliste.name} (${fallbackCheckliste.id})`);
          combinedChecklisten.push(fallbackCheckliste);
        } else if (existsInApi) {
          console.log(`  ⏭️  Überspringe Fallback-Checkliste (existiert bereits in API): ${fallbackCheckliste.name}`);
        } else if (wasDeleted) {
          console.log(`  🗑️  Überspringe Fallback-Checkliste (vom Benutzer gelöscht): ${fallbackCheckliste.name}`);
        }
      });
      
      console.log("📋 Finale Checklisten im Context:", combinedChecklisten.length, "Checklisten");
      console.log("📋 Finale Checklisten-Details:", JSON.stringify(combinedChecklisten.map(c => ({ id: c.id, name: c.name })), null, 2));
      setChecklisten(combinedChecklisten);
    } catch (err: any) {
      console.error("❌ Fehler beim Laden der Checklisten:", err);
      // Bei Fehler: Verwende initiale Checklisten (aber nur die nicht gelöschten)
      const deletedFallbackIds = getDeletedFallbackChecklisten();
      const filteredInitial = initialChecklisten.filter(c => !deletedFallbackIds.includes(c.id));
      setChecklisten(filteredInitial);
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
    // Prüfe ob es eine Fallback-Checkliste ist
    const isFallback = initialChecklisten.some(c => c.id === id);
    if (isFallback) {
      // Markiere Fallback-Checkliste als gelöscht
      markFallbackChecklisteAsDeleted(id);
    }
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

export function useChecklistenOptional() {
  const context = useContext(ChecklistenContext);
  return context;
}
