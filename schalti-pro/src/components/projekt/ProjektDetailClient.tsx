"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Calendar, Clock, FileText, Box } from "lucide-react";
import { ProjectHeader } from "@/components/projekt/ProjectHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProtokollForm } from "@/components/protokoll/ProtokollForm";
import { ActivityList } from "@/components/protokoll/ActivityList";
import { ComponentsList } from "@/components/komponenten/ComponentsList";
import { ProjectChat } from "@/components/projekt/ProjectChat";
import { useMe, useChatByProjekt, useCreateProtokoll, useUpdateKomponente, useUpdateProjekt } from "@/lib/hooks";
import { komponenteApi } from "@/lib/api";
import { formatStunden } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import type { Projekt, Arbeitsprotokoll, Komponente, ProtokollFormData } from "@/types";

interface ProjektDetailClientProps {
  projekt: Projekt;
  initialProtokolle: Arbeitsprotokoll[];
  initialKomponenten: Komponente[];
}

export function ProjektDetailClient({
  projekt: initialProjekt,
  initialProtokolle,
  initialKomponenten,
}: ProjektDetailClientProps) {
  const [projekt, setProjekt] = useState<Projekt>(initialProjekt);
  const [protokolle, setProtokolle] = useState<Arbeitsprotokoll[]>(initialProtokolle);
  const [komponenten, setKomponenten] = useState<Komponente[]>(initialKomponenten);
  // Ref um zu verfolgen, welche Komponenten über Checklisten abgeschlossen wurden
  const viaChecklisteAbgeschlossen = useRef<Set<string>>(new Set());

  // Aktualisiere State, wenn initiale Daten sich ändern
  useEffect(() => {
    setProjekt(initialProjekt);
  }, [initialProjekt]);

  useEffect(() => {
    setProtokolle(initialProtokolle);
  }, [initialProtokolle]);

  useEffect(() => {
    setKomponenten(initialKomponenten);
  }, [initialKomponenten]);

  const { data: currentUser } = useMe();
  const { data: chatMessages = [] } = useChatByProjekt(projekt.id);
  
  // Mutations
  const createProtokollMutation = useCreateProtokoll();
  const updateKomponenteMutation = useUpdateKomponente();
  const updateProjektMutation = useUpdateProjekt();

  // Berechne aktualisierte Stats basierend auf projekt-spezifischen Status
  const aktualisierteStats = useMemo(() => {
    const abgeschlosseneKomponenten = komponenten.filter(
      (k) => k.status === "abgeschlossen"
    ).length;
    const gesamtKomponenten = komponenten.length; // Gesamtanzahl der Komponenten im Projekt
    return {
      ...projekt.stats,
      komponenten: abgeschlosseneKomponenten,
      gesamtKomponenten: gesamtKomponenten || projekt.stats.gesamtKomponenten, // Fallback auf projekt.stats falls leer
    };
  }, [komponenten, projekt.stats]);

  const tageAktiv = differenceInDays(new Date(), projekt.createdAt);

  // Lade projekt-spezifische Status
  const [projektStatusMap, setProjektStatusMap] = useState<Record<string, "abgeschlossen" | "ausstehend">>({});
  
  useEffect(() => {
    const loadProjektStatus = async () => {
      try {
        const statusMap = await komponenteApi.getStatusByProjekt(projekt.id);
        setProjektStatusMap(statusMap);
        
        // Merge Status in Komponenten
        setKomponenten((prev) =>
          prev.map((k) => ({
            ...k,
            status: statusMap[k.id] || k.status || "ausstehend",
          }))
        );
      } catch (error) {
        console.error("Fehler beim Laden der projekt-spezifischen Status:", error);
      }
    };
    
    loadProjektStatus();
  }, [projekt.id]);

  // Callback: Komponente wurde abgeschlossen oder zurückgesetzt
  const handleKomponenteAbgeschlossen = async (
    komponenteId: string,
    status: "abgeschlossen" | "ausstehend",
    viaCheckliste: boolean = false
  ): Promise<void> => {
    // Finde die Komponente
    const komponente = komponenten.find((k) => k.id === komponenteId);
    if (!komponente) return;

    // Wenn über Checkliste abgeschlossen, markiere in Ref
    if (viaCheckliste && status === "abgeschlossen") {
      viaChecklisteAbgeschlossen.current.add(komponenteId);
      // Entferne nach kurzer Zeit, damit es nicht dauerhaft gespeichert bleibt
      setTimeout(() => {
        viaChecklisteAbgeschlossen.current.delete(komponenteId);
      }, 5000); // 5 Sekunden sollten ausreichen
    }

    // Aktualisiere lokalen Status
    setProjektStatusMap((prev) => ({
      ...prev,
      [komponenteId]: status,
    }));

    // Aktualisiere Komponenten-Status
    setKomponenten((prev) =>
      prev.map((k) =>
        k.id === komponenteId ? { ...k, status } : k
      )
    );

    // Wenn über Checkliste abgeschlossen, KEIN Protokoll erstellen
    // Das Protokoll wird später beim Absenden der Checkliste erstellt
    if (viaCheckliste && status === "abgeschlossen") {
      // Aber Status trotzdem speichern
      try {
        await komponenteApi.updateStatusInProjekt(projekt.id, komponenteId, status);
      } catch (error) {
        console.error("Fehler beim Speichern des projekt-spezifischen Status:", error);
      }
      return;
    }

    // Status-Änderung auf Server speichern (projekt-spezifisch)
    try {
      await komponenteApi.updateStatusInProjekt(projekt.id, komponenteId, status);
      
      // Nur bei Abschluss ein Protokoll erstellen (nicht beim Zurücksetzen)
      if (status === "abgeschlossen") {
        const neuesProtokoll = await createProtokollMutation.mutateAsync({
          aufgabe: "Komponente abgeschlossen",
          details: `${komponente.name} (${komponente.artikelNummer}) wurde abgeschlossen`,
          zeitaufwand: 0, // Keine Zeit, da automatisch
          datum: new Date().toISOString(),
          projektId: projekt.id,
        });

        const transformedProtokoll: Arbeitsprotokoll = {
          ...(neuesProtokoll as any),
          datum: new Date((neuesProtokoll as any).datum),
        };

        // Protokoll zur Liste hinzufügen (ganz oben)
        setProtokolle((prev) => [transformedProtokoll, ...prev]);
      }
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren der Komponente:", error);
    }
  };

  // Callback: Protokoll wurde erstellt (vom Form)
  const handleProtokollErstellt = async (formData: ProtokollFormData) => {
    // Sammle alle Komponenten-IDs aus der Checkliste
    // WICHTIG: Nur Komponenten hinzufügen, deren Checklisten vollständig sind
    // (Komponenten mit Checklisten werden nur hinzugefügt, wenn sie bereits als "abgeschlossen" markiert sind)
    const abgeschlosseneKomponentenIds: string[] = [];
    
    if (formData.abnahmeCheckliste) {
      formData.abnahmeCheckliste.forEach((item) => {
        if (item.checked) {
          let komponente: Komponente | undefined;
          
          if (item.komponenteId) {
            komponente = komponenten.find((k) => k.id === item.komponenteId);
          } else if (item.artikelNummer) {
            komponente = komponenten.find((k) => k.artikelNummer === item.artikelNummer);
          }
          
          if (komponente) {
            // Prüfe ob Komponente eine Checkliste hat
            if (komponente.checklisteId) {
              // Komponente hat Checkliste - nur hinzufügen wenn bereits abgeschlossen
              // (was bedeutet, dass die Checkliste vollständig ist)
              if (komponente.status === "abgeschlossen") {
                abgeschlosseneKomponentenIds.push(komponente.id);
              }
            } else {
              // Komponente hat keine Checkliste - direkt hinzufügen
              abgeschlosseneKomponentenIds.push(komponente.id);
            }
          }
        }
      });
    }

    // Neues Protokoll über API erstellen
    try {
      const neuesProtokoll = await createProtokollMutation.mutateAsync({
        aufgabe: formData.aufgabe,
        details: formData.details || undefined,
        zeitaufwand: formData.zeitaufwand,
        datum: new Date().toISOString(),
        projektId: projekt.id,
        abnahmeStatus: formData.abnahmeStatus,
        abnahmeCheckliste: formData.abnahmeCheckliste,
        abnahmeTyp: formData.abnahmeTyp,
        checklisteStatus: formData.checklisteStatus,
        abgeschlosseneKomponentenIds: abgeschlosseneKomponentenIds.length > 0 
          ? abgeschlosseneKomponentenIds 
          : undefined,
      });

      // Transformiere Backend-Response zu Frontend-Format
      const transformedProtokoll: Arbeitsprotokoll = {
        ...(neuesProtokoll as any),
        datum: new Date((neuesProtokoll as any).datum),
      };

      // Protokoll zur Liste hinzufügen (ganz oben)
      setProtokolle((prev) => [transformedProtokoll, ...prev]);

      // Komponenten-Status aktualisieren, falls welche abgeschlossen wurden
      if (abgeschlosseneKomponentenIds.length > 0) {
        for (const komponenteId of abgeschlosseneKomponentenIds) {
          await updateKomponenteMutation.mutateAsync({ id: komponenteId, data: { status: "abgeschlossen" } });
          setKomponenten((prev) =>
            prev.map((k) =>
              k.id === komponenteId ? { ...k, status: "abgeschlossen" } : k
            )
          );
        }
      }
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Protokolls:", error);
      alert("Fehler beim Erstellen des Protokolls: " + (error.message || "Unbekannter Fehler"));
    }
  };

  // Callback: Schaltschranknummer wurde geändert
  const handleSchaltschrankNummerChange = async (nummer: string | undefined) => {
    try {
      await updateProjektMutation.mutateAsync({ id: projekt.id, data: { schaltschrankNummer: nummer } });
      setProjekt((prev) => ({
        ...prev,
        schaltschrankNummer: nummer,
      }));
    } catch (error: any) {
      console.error("Fehler beim Aktualisieren der Schaltschranknummer:", error);
      alert("Fehler beim Aktualisieren: " + (error.message || "Unbekannter Fehler"));
    }
  };

  return (
    <div className="space-y-6 md:space-y-6 lg:space-y-6 xl:space-y-8">
      {/* Project Header */}
      <ProjectHeader 
        projekt={projekt} 
        onSchaltschrankNummerChange={handleSchaltschrankNummerChange}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
        <StatsCard
          value={formatStunden(aktualisierteStats.stunden)}
          label="Gesamt Stunden"
          icon={Clock}
        />
        <StatsCard
          value={protokolle.length}
          label="Einträge"
          icon={FileText}
        />
        <StatsCard
          value={`${aktualisierteStats.komponenten} / ${aktualisierteStats.gesamtKomponenten}`}
          label="Komponenten"
          icon={Box}
        />
        <StatsCard
          value={tageAktiv}
          label="Tage aktiv"
          icon={Calendar}
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-4 lg:space-y-4 xl:space-y-6">
          <ProtokollForm 
            projektId={projekt.id} 
            onSubmit={handleProtokollErstellt}
            currentUser={currentUser}
            protokolle={protokolle}
            komponenten={komponenten}
            onKomponenteAktualisieren={handleKomponenteAbgeschlossen}
          />
          <ComponentsList
            komponenten={komponenten}
            onKomponenteAbgeschlossen={(komponente) => {
              // Prüfe ob Komponente über Checkliste abgeschlossen wurde
              if (viaChecklisteAbgeschlossen.current.has(komponente.id)) {
                // Komponente wurde über Checkliste abgeschlossen - kein Protokoll erstellen
                return;
              }
              handleKomponenteAbgeschlossen(komponente.id, "abgeschlossen", false);
            }}
            onKomponentenChange={setKomponenten}
            onKomponenteStatusChange={(komponenteId, status) => {
              // Status-Änderung auf Server speichern (auch für Zurücksetzen)
              handleKomponenteAbgeschlossen(komponenteId, status, false);
            }}
            currentUser={currentUser || undefined}
          />
        </div>

        {/* Right Column (1/3) */}
        <div>
          <ActivityList protokolle={protokolle} komponenten={komponenten} />
        </div>
      </div>

      {/* Chat Component */}
      <ProjectChat
        projektId={projekt.id}
        messages={chatMessages}
        currentUser={currentUser || undefined}
        onSendMessage={(text, imageUrl) => {
          // In a real app, this would send the message to the server
          console.log("Sending message:", text, imageUrl ? "with image" : "text only");
        }}
      />
    </div>
  );
}

