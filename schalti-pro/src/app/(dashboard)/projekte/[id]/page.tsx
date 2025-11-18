"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjektDetailClient } from "@/components/projekt/ProjektDetailClient";
import { projektApi, protokollApi, komponenteApi } from "@/lib/api";
import type { Projekt, Komponente } from "@/types";

export default function ProjektDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projekt, setProjekt] = useState<Projekt | null>(null);
  const [protokolle, setProtokolle] = useState<any[]>([]);
  const [komponenten, setKomponenten] = useState<Komponente[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projektData, protokolleData, alleKomponenten] = await Promise.all([
          projektApi.getById(id),
          protokollApi.getByProjekt(id),
          komponenteApi.getAll(), // Lade alle Komponenten
        ]);

        if (!projektData) {
          router.push("/projekte");
          return;
        }

        // Transformiere Backend-Daten zu Frontend-Format
        const komponentenIds = projektData.komponenten_ids || projektData.komponentenIds || [];
        console.log("Projekt-Detail: komponenten_ids from API:", projektData.komponenten_ids);
        console.log("Projekt-Detail: komponentenIds from API:", projektData.komponentenIds);
        console.log("Projekt-Detail: Final komponentenIds:", komponentenIds);
        console.log("Projekt-Detail: Alle Komponenten:", alleKomponenten);
        
        const transformedProjekt = {
          ...projektData,
          createdAt: new Date(projektData.created_at || projektData.createdAt),
          stats: projektData.stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
          schaltschrankNummer: projektData.schaltschrank_nummer || projektData.schaltschrankNummer,
          komponentenIds: komponentenIds,
        };

        const transformedProtokolle = protokolleData.map((p: any) => ({
          ...p,
          datum: new Date(p.datum),
        }));

        // Filtere Komponenten basierend auf komponentenIds im Projekt
        // Stelle sicher, dass beide als Strings verglichen werden
        const projektKomponenten = alleKomponenten.filter((k: Komponente) => {
          const komponenteId = String(k.id);
          const isIncluded = komponentenIds.some((id: string) => String(id) === komponenteId);
          console.log(`Komponente ${k.name} (${k.id}): isIncluded=${isIncluded}, komponentenIds=${JSON.stringify(komponentenIds)}`);
          return isIncluded;
        });

        console.log("Projekt-Detail: Gefilterte Komponenten:", projektKomponenten);

        setProjekt(transformedProjekt as Projekt);
        setProtokolle(transformedProtokolle);
        setKomponenten(projektKomponenten);
      } catch (err: any) {
        console.error("Error loading project:", err);
        setError(err.message || "Fehler beim Laden des Projekts");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Projekt...</p>
      </div>
    );
  }

  if (error || !projekt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Projekt nicht gefunden"}</p>
          <button
            onClick={() => router.push("/projekte")}
            className="text-blue-600 hover:underline"
          >
            Zurück zu Projekten
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjektDetailClient
      projekt={projekt}
      initialProtokolle={protokolle}
      initialKomponenten={komponenten}
    />
  );
}
