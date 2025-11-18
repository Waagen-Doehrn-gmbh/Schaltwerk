"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projekt/ProjectCard";
import { projektApi } from "@/lib/api";
import type { ProjektStatus, Projekt } from "@/types";
import { cn } from "@/lib/utils";

export default function ProjektePage() {
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjektStatus | "alle">("alle");

  useEffect(() => {
    const loadProjekte = async () => {
      try {
        setIsLoading(true);
        const data = await projektApi.getAll();
        const transformed = data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.created_at || p.createdAt),
          stats: p.stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
          schaltschrankNummer: p.schaltschrank_nummer || p.schaltschrankNummer,
          komponentenIds: p.komponenten_ids || p.komponentenIds || [],
        }));
        setProjekte(transformed);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Projekte");
        console.error("Error loading projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjekte();
  }, []);

  const filteredProjekte = projekte.filter((projekt) => {
    const matchesSearch =
      projekt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projekt.standort.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "alle" || projekt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort: Status (in_bearbeitung > planung > abgeschlossen), dann Datum
  const sortedProjekte = [...filteredProjekte].sort((a, b) => {
    const statusOrder: Record<ProjektStatus, number> = {
      in_bearbeitung: 1,
      planung: 2,
      abgeschlossen: 3,
    };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-muted-foreground">Lade Projekte...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">Fehler: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-4 lg:space-y-4 xl:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground">Alle Projekte</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-3 lg:gap-3 xl:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
          <Input
            placeholder="Projekte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(["alle", "in_bearbeitung", "abgeschlossen", "planung"] as const).map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  statusFilter === status && "bg-blue-600 text-white"
                )}
              >
                {status === "alle"
                  ? "Alle"
                  : status === "in_bearbeitung"
                  ? "Aktiv"
                  : status === "abgeschlossen"
                  ? "Abgeschlossen"
                  : "Planung"}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Projekte Grid */}
      {sortedProjekte.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
          {sortedProjekte.map((projekt) => (
            <ProjectCard key={projekt.id} projekt={projekt} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-muted-foreground">Keine Projekte gefunden</p>
        </div>
      )}
    </div>
  );
}

