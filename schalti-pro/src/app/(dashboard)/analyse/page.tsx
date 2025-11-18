"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { AnalyseFilter } from "@/components/analyse/AnalyseFilter";
import { DauerChart } from "@/components/analyse/DauerChart";
import { EffektivitaetChart } from "@/components/analyse/EffektivitaetChart";
import { ZeitverlaufChart } from "@/components/analyse/ZeitverlaufChart";
import { StatusChart } from "@/components/analyse/StatusChart";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { projektApi, protokollApi, komponenteApi } from "@/lib/api";
import type { Projekt, Arbeitsprotokoll, Komponente } from "@/types";
import type { ProjektStatus } from "@/types";
import { formatStunden } from "@/lib/utils";
import { Clock, TrendingUp, Target, Calendar } from "lucide-react";

interface AnalyseDaten {
  projektId: string;
  projektName: string;
  dauer: number;
  effektivitaet: number;
  komponentenFortschritt: number;
  tageAktiv: number;
  durchschnittlicheStundenProTag: number;
}

interface ZeitverlaufDaten {
  datum: string;
  stunden: number;
  projektName?: string; // Optional für Kompatibilität
}

interface StatusVerteilung {
  name: string;
  value: number;
  prozent: number;
}

export default function AnalysePage() {
  const [filters, setFilters] = useState<{
    status?: ProjektStatus;
    datumVon?: Date;
    datumBis?: Date;
  }>({});

  const [analyseDaten, setAnalyseDaten] = useState<AnalyseDaten[]>([]);
  const [zeitverlaufDaten, setZeitverlaufDaten] = useState<ZeitverlaufDaten[]>([]);
  const [statusVerteilung, setStatusVerteilung] = useState<StatusVerteilung[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projekteData, protokolleData, komponentenData] = await Promise.all([
          projektApi.getAll(),
          protokollApi.getAll(),
          komponenteApi.getAll(),
        ]);

        // Transformiere Backend-Daten
        const projekte = projekteData.map((p: any) => ({
          ...p,
          createdAt: new Date(p.created_at || p.createdAt),
          stats: p.stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
        }));

        const protokolle = protokolleData.map((p: any) => ({
          ...p,
          datum: new Date(p.datum),
        }));

        // Filtere Projekte
        let gefilterteProjekte = projekte;
        if (filters.status) {
          gefilterteProjekte = gefilterteProjekte.filter((p) => p.status === filters.status);
        }
        if (filters.datumVon) {
          gefilterteProjekte = gefilterteProjekte.filter((p) => p.createdAt >= filters.datumVon!);
        }
        if (filters.datumBis) {
          gefilterteProjekte = gefilterteProjekte.filter((p) => p.createdAt <= filters.datumBis!);
        }

        // Berechne Analyse-Daten
        const analyse = gefilterteProjekte.map((projekt) => {
          const projektProtokolle = protokolle.filter((p) => p.projektId === projekt.id);
          const projektKomponenten = komponentenData.filter((k: any) => k.projektId === projekt.id);
          const abgeschlosseneKomponenten = projektKomponenten.filter((k: any) => k.status === "abgeschlossen");

          const dauer = projektProtokolle.reduce((sum, p) => sum + (p.zeitaufwand || 0), 0);
          const effektivitaet = abgeschlosseneKomponenten.length > 0 ? dauer / abgeschlosseneKomponenten.length : 0;
          const komponentenFortschritt = projektKomponenten.length > 0
            ? (abgeschlosseneKomponenten.length / projektKomponenten.length) * 100
            : 0;

          const tageAktiv = projektProtokolle.length > 0
            ? Math.ceil(
                (Math.max(...projektProtokolle.map((p) => p.datum.getTime())) -
                  Math.min(...projektProtokolle.map((p) => p.datum.getTime()))) /
                  (1000 * 60 * 60 * 24)
              ) || 1
            : 0;

          const durchschnittlicheStundenProTag = tageAktiv > 0 ? dauer / tageAktiv : 0;

          return {
            projektId: projekt.id,
            projektName: projekt.name,
            dauer,
            effektivitaet,
            komponentenFortschritt,
            tageAktiv,
            durchschnittlicheStundenProTag,
          };
        });

        setAnalyseDaten(analyse);

        // Berechne Zeitverlauf-Daten
        const gefilterteProtokolle = protokolle.filter((p) => {
          if (filters.datumVon && p.datum < filters.datumVon) return false;
          if (filters.datumBis && p.datum > filters.datumBis) return false;
          return true;
        });

        const zeitverlaufMap = new Map<string, number>();
        gefilterteProtokolle.forEach((p) => {
          const datumStr = p.datum.toISOString().split("T")[0];
          zeitverlaufMap.set(datumStr, (zeitverlaufMap.get(datumStr) || 0) + (p.zeitaufwand || 0));
        });

        const zeitverlauf = Array.from(zeitverlaufMap.entries())
          .map(([datum, stunden]) => ({ datum, stunden, projektName: "" }))
          .sort((a, b) => a.datum.localeCompare(b.datum));

        setZeitverlaufDaten(zeitverlauf);

        // Berechne Status-Verteilung
        const statusMap = new Map<string, number>();
        projekte.forEach((p) => {
          const status = p.status || "planung";
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        const total = projekte.length;
        const status = Array.from(statusMap.entries()).map(([statusKey, value]) => ({
          name: statusKey === "in_bearbeitung" ? "In Bearbeitung" : statusKey === "abgeschlossen" ? "Abgeschlossen" : "Planung",
          value,
          prozent: total > 0 ? (value / total) * 100 : 0,
          status: statusKey,
          anzahl: value,
        }));

        setStatusVerteilung(status);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Daten");
        console.error("Error loading analysis data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters]);

  // Berechne Gesamtstatistiken
  const gesamtStunden = analyseDaten.reduce((sum, d) => sum + d.dauer, 0);
  const durchschnittlicheEffektivitaet =
    analyseDaten.length > 0
      ? analyseDaten.reduce((sum, d) => sum + d.effektivitaet, 0) /
        analyseDaten.filter((d) => d.effektivitaet > 0).length
      : 0;
  const durchschnittlicherFortschritt =
    analyseDaten.length > 0
      ? analyseDaten.reduce((sum, d) => sum + d.komponentenFortschritt, 0) /
        analyseDaten.length
      : 0;
  const durchschnittlicheTageAktiv =
    analyseDaten.length > 0
      ? analyseDaten.reduce((sum, d) => sum + d.tageAktiv, 0) / analyseDaten.length
      : 0;

  return (
    <div className="space-y-6 md:space-y-6 lg:space-y-6 xl:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground mb-2 flex items-center gap-2 md:gap-3">
          <BarChart3 className="h-6 w-6 md:h-7 md:w-7 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-500" />
          Analyse
        </h1>
        <p className="text-sm md:text-sm lg:text-sm xl:text-base text-slate-600 dark:text-muted-foreground">
          Dauer und Effektivität der Schaltschrank-Projekte
        </p>
      </div>

      {/* Filter */}
      <AnalyseFilter onFilterChange={setFilters} />

      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 dark:text-muted-foreground">Lade Daten...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
        <StatsCard
          value={formatStunden(gesamtStunden)}
          label="Gesamt Stunden"
          icon={Clock}
        />
        <StatsCard
          value={
            durchschnittlicheEffektivitaet > 0
              ? `${durchschnittlicheEffektivitaet.toFixed(2)} Std/Komp`
              : "N/A"
          }
          label="Ø Effektivität"
          icon={TrendingUp}
        />
        <StatsCard
          value={`${durchschnittlicherFortschritt.toFixed(0)}%`}
          label="Ø Komponenten-Fortschritt"
          icon={Target}
        />
        <StatsCard
          value={durchschnittlicheTageAktiv > 0 ? `${durchschnittlicheTageAktiv.toFixed(1)} Tage` : "N/A"}
          label="Ø Tage aktiv"
          icon={Calendar}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
        {/* Dauer Chart */}
        <DauerChart daten={analyseDaten} />

        {/* Effektivität Chart */}
        <EffektivitaetChart daten={analyseDaten} />

        {/* Zeitverlauf Chart */}
        <div className="lg:col-span-2">
          <ZeitverlaufChart daten={zeitverlaufDaten} />
        </div>

        {/* Status Chart */}
        <div className="lg:col-span-2">
          <StatusChart daten={statusVerteilung} />
        </div>
      </div>

      {/* Detaillierte Tabelle */}
      {analyseDaten.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-4 lg:p-4 xl:p-6">
            <h3 className="text-lg md:text-lg lg:text-lg xl:text-xl font-bold text-slate-900 dark:text-foreground mb-3 md:mb-3 lg:mb-3 xl:mb-4">
              Detaillierte Übersicht
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-sm lg:text-sm xl:text-base">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-border">
                    <th className="text-left py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Projekt
                    </th>
                    <th className="text-right py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Dauer (Std)
                    </th>
                    <th className="text-right py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Effektivität
                    </th>
                    <th className="text-right py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Fortschritt
                    </th>
                    <th className="text-right py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Tage aktiv
                    </th>
                    <th className="text-right py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-semibold text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                      Ø Std/Tag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyseDaten
                    .sort((a, b) => b.dauer - a.dauer)
                    .map((item) => (
                      <tr
                        key={item.projektId}
                        className="border-b border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-muted transition-colors"
                      >
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 font-medium text-slate-900 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {item.projektName}
                        </td>
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 text-right text-slate-700 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {formatStunden(item.dauer)}
                        </td>
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 text-right text-slate-700 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {item.effektivitaet > 0
                            ? `${item.effektivitaet.toFixed(2)} Std/Komp`
                            : "N/A"}
                        </td>
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 text-right text-slate-700 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {item.komponentenFortschritt.toFixed(0)}%
                        </td>
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 text-right text-slate-700 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {item.tageAktiv} Tage
                        </td>
                        <td className="py-2 md:py-2 lg:py-2 xl:py-3 px-2 md:px-3 lg:px-3 xl:px-4 text-right text-slate-700 dark:text-foreground text-xs md:text-xs lg:text-xs xl:text-sm">
                          {item.durchschnittlicheStundenProTag > 0
                            ? formatStunden(item.durchschnittlicheStundenProTag)
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {analyseDaten.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 dark:text-muted-foreground text-lg">
              Keine Daten gefunden. Bitte passen Sie die Filter an.
            </p>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}

