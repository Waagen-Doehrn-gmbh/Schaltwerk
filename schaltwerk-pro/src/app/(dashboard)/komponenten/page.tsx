"use client";

import { useState } from "react";
import { Search, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useKomponenten, useProjekte } from "@/lib/hooks";

export default function KomponentenPage() {
  const { data: komponenten = [], isLoading: komponentenLoading, error: komponentenError } = useKomponenten();
  const { data: projekte = [], isLoading: projekteLoading } = useProjekte();
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = komponentenLoading || projekteLoading;
  const error = komponentenError ? (komponentenError as Error).message : null;

  const filteredKomponenten = komponenten.filter((komponente) => {
    return (
      komponente.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      komponente.artikelNummer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sortiere nach Name
  const sortedKomponenten = [...filteredKomponenten].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-muted-foreground">Lade Komponenten...</div>
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

  const getProjektName = (projektId: string | null): string => {
    if (!projektId) return "Kein Projekt";
    const projekt = projekte.find((p) => p.id === projektId);
    return projekt?.name || "Unbekanntes Projekt";
  };

  return (
    <div className="space-y-4 md:space-y-4 lg:space-y-4 xl:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Box className="h-6 w-6 md:h-7 md:w-7 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-600" />
          <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground">
            Komponenten
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-3 lg:gap-3 xl:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
          <Input
            placeholder="Komponenten durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Komponenten Grid */}
      {sortedKomponenten.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
          {sortedKomponenten.map((komponente) => (
            <Card key={komponente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-4 lg:p-4 xl:p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-foreground mb-1 break-words">
                        {komponente.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-muted-foreground">
                        Art.-Nr.: {komponente.artikelNummer}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-border">
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">
                      Projekt: {getProjektName(komponente.projektId)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-muted-foreground">Keine Komponenten gefunden</p>
        </div>
      )}
    </div>
  );
}

