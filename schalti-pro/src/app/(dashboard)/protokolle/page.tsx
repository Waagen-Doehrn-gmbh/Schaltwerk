"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { protokollApi, projektApi } from "@/lib/api";
import { formatDate, formatStunden, getAvatarUrl, getDisplayName } from "@/lib/utils";
import type { Arbeitsprotokoll, Projekt } from "@/types";

export default function ProtokollePage() {
  const [allProtokolle, setAllProtokolle] = useState<Arbeitsprotokoll[]>([]);
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projektFilter, setProjektFilter] = useState<string>("alle");
  const [userFilter, setUserFilter] = useState<string>("alle");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [protokolleData, projekteData] = await Promise.all([
          protokollApi.getAll(),
          projektApi.getAll(),
        ]);

        const transformedProtokolle = protokolleData.map((p: any) => ({
          ...p,
          datum: new Date(p.datum),
        }));

        const transformedProjekte = projekteData.map((p: any) => ({
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

        setAllProtokolle(transformedProtokolle);
        setProjekte(transformedProjekte);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Protokolle");
        console.error("Error loading protocols:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProtokolle = allProtokolle.filter((protokoll) => {
    const matchesSearch =
      protokoll.aufgabe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protokoll.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProjekt =
      projektFilter === "alle" || protokoll.projektId === projektFilter;
    const matchesUser =
      userFilter === "alle" || protokoll.userId === userFilter;
    return matchesSearch && matchesProjekt && matchesUser;
  });

  // Sort by date (newest first)
  const sortedProtokolle = [...filteredProtokolle].sort(
    (a, b) => b.datum.getTime() - a.datum.getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-muted-foreground">Lade Protokolle...</div>
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
        <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground">
          Arbeitsprotokolle
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-3 lg:gap-3 xl:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
          <Input
            placeholder="Protokolle durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projekt Filter */}
        <Select value={projektFilter} onValueChange={setProjektFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Projekt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Projekte</SelectItem>
            {projekte.map((projekt) => (
              <SelectItem key={projekt.id} value={projekt.id}>
                {projekt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User Filter */}
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Mitarbeiter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Mitarbeiter</SelectItem>
            {Array.from(new Map(allProtokolle.filter(p => p.user).map(p => [p.user!.id, p.user!])).values()).map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Protokolle Cards */}
      {sortedProtokolle.length > 0 ? (
        <div className="space-y-3 md:space-y-3 lg:space-y-3 xl:space-y-4">
          {sortedProtokolle.map((protokoll) => {
            const projekt = projekte.find((p) => p.id === protokoll.projektId);

            return (
              <Card key={protokoll.id} className="p-4 md:p-4 lg:p-4 xl:p-6 hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-start gap-3">
                  <Avatar className="flex-shrink-0 h-8 w-8 md:h-8 md:w-8 lg:h-8 lg:w-8 xl:h-10 xl:w-10">
                    {protokoll.user && getAvatarUrl(protokoll.user.id) && (
                      <AvatarImage 
                        src={getAvatarUrl(protokoll.user.id)!} 
                        alt={protokoll.user.name} 
                      />
                    )}
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {protokoll.user?.initialen || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-foreground text-sm">
                            {protokoll.user?.name || "Unbekannt"}
                          </span>
                          <span className="text-slate-400 dark:text-muted-foreground">•</span>
                          <span className="text-slate-600 dark:text-muted-foreground text-xs break-words">
                            {projekt?.name || "Unbekanntes Projekt"}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm md:text-sm lg:text-sm xl:text-lg text-slate-900 dark:text-foreground mb-1 break-words">
                          {protokoll.aufgabe}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex-shrink-0 text-xs px-2.5 py-1 w-fit md:w-auto"
                      >
                        {formatStunden(protokoll.zeitaufwand)}
                      </Badge>
                    </div>
                    {protokoll.details && (
                      <p className="text-xs md:text-xs lg:text-xs xl:text-sm text-slate-600 dark:text-muted-foreground mb-2 md:mb-2 lg:mb-2 xl:mb-3">{protokoll.details}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">
                      {formatDate(protokoll.datum)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-muted-foreground">Keine Protokolle gefunden</p>
        </div>
      )}
    </div>
  );
}

