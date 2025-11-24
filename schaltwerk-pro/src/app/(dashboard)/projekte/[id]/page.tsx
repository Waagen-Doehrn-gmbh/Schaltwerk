"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjektDetailClient } from "@/components/projekt/ProjektDetailClient";
import { useProjekt, useProtokolleByProjekt, useKomponenten } from "@/lib/hooks";
import type { Komponente } from "@/types";

export default function ProjektDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: projekt, isLoading: projektLoading, error: projektError } = useProjekt(id);
  const { data: protokolle = [], isLoading: protokolleLoading } = useProtokolleByProjekt(id);
  const { data: alleKomponenten = [], isLoading: komponentenLoading } = useKomponenten();

  const isLoading = projektLoading || protokolleLoading || komponentenLoading;
  const error = projektError ? (projektError as Error).message : null;

  // Filtere Komponenten basierend auf komponentenIds im Projekt
  const komponenten = useMemo(() => {
    if (!projekt || !alleKomponenten.length) return [];
    const komponentenIds = projekt.komponentenIds || [];
    return alleKomponenten.filter((k: Komponente) => {
      const komponenteId = String(k.id);
      return komponentenIds.some((id: string) => String(id) === komponenteId);
    });
  }, [projekt, alleKomponenten]);

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
