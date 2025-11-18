"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, FolderOpen, FileText, Box } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/projekt/ProjectCard";
import { formatDate, formatStunden, getAvatarUrl, getDisplayName } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { projektApi, protokollApi, authApi } from "@/lib/api";
import { useState, useEffect } from "react";
import type { Projekt, Arbeitsprotokoll, User } from "@/types";

export default function DashboardPage() {
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [recentActivity, setRecentActivity] = useState<Arbeitsprotokoll[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projekteData, protokolleData, userData] = await Promise.all([
          projektApi.getAll(),
          protokollApi.getAll(),
          authApi.getMe().catch(() => null),
        ]);
        
        if (userData) {
          setCurrentUser(userData as User);
        }
        
        // Transformiere Backend-Daten zu Frontend-Format
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

        const transformedProtokolle = protokolleData
          .map((p: any) => ({
            ...p,
            datum: new Date(p.datum),
          }))
          .sort((a: any, b: any) => b.datum.getTime() - a.datum.getTime())
          .slice(0, 5);

        setProjekte(transformedProjekte);
        setRecentActivity(transformedProtokolle);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Daten");
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-muted-foreground">Lade Daten...</div>
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

  // Calculate stats
  const totalStunden = projekte.reduce((sum, p) => sum + (p.stats?.stunden || 0), 0);
  const activeProjekte = projekte.filter(
    (p) => p.status === "in_bearbeitung"
  ).length;
  
  // Einträge diese Woche (letzte 7 Tage)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const eintraegeDieseWoche = recentActivity.filter(
    (a) => a.datum >= weekAgo
  ).length;

  const offeneKomponenten = projekte.reduce(
    (sum, p) => sum + ((p.stats?.gesamtKomponenten || 0) - (p.stats?.komponenten || 0)),
    0
  );

  const currentDate = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  return (
    <div className="space-y-6 md:space-y-6 lg:space-y-6 xl:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground mb-2">
          Willkommen zurück, {currentUser?.name || "Benutzer"}
        </h1>
        <p className="text-sm md:text-sm lg:text-sm xl:text-base text-slate-600 dark:text-muted-foreground">{currentDate}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
        <StatsCard
          value={formatStunden(totalStunden)}
          label="Gesamt Stunden"
          icon={Clock}
        />
        <StatsCard
          value={activeProjekte}
          label="Aktive Projekte"
          icon={FolderOpen}
        />
        <StatsCard
          value={eintraegeDieseWoche}
          label="Einträge diese Woche"
          icon={FileText}
        />
        <StatsCard
          value={offeneKomponenten}
          label="Offene Komponenten"
          icon={Box}
        />
      </div>

      {/* Projekte Grid */}
      <div>
        <h2 className="text-xl md:text-xl lg:text-xl xl:text-2xl font-bold text-slate-900 dark:text-foreground mb-4 md:mb-4 lg:mb-4 xl:mb-6">Projekte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-4 lg:gap-4 xl:gap-6">
          {projekte.map((projekt) => (
            <ProjectCard key={projekt.id} projekt={projekt} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl md:text-xl lg:text-xl xl:text-2xl font-bold text-slate-900 dark:text-foreground mb-4 md:mb-4 lg:mb-4 xl:mb-6">
          Letzte Aktivitäten
        </h2>
        <Card className="p-4 md:p-4 lg:p-4 xl:p-6">
          <div className="space-y-3 md:space-y-3 lg:space-y-3 xl:space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 md:gap-3 lg:gap-3 xl:gap-4 p-3 md:p-3 lg:p-3 xl:p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8 md:h-8 md:w-8 lg:h-8 lg:w-8 xl:h-10 xl:w-10">
                    {activity.user && getAvatarUrl(activity.user.id) && (
                      <AvatarImage 
                        src={getAvatarUrl(activity.user.id)!} 
                        alt={activity.user.name} 
                      />
                    )}
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {activity.user?.initialen || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm md:text-sm lg:text-sm xl:text-base text-slate-900 dark:text-foreground">
                        {activity.user?.name || "Unbekannt"}
                      </span>
                      <span className="text-slate-600 dark:text-muted-foreground">•</span>
                      <span className="font-medium text-xs md:text-xs lg:text-xs xl:text-sm text-slate-900 dark:text-foreground">
                        {activity.aufgabe}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-xs md:text-xs lg:text-xs xl:text-sm text-slate-600 dark:text-muted-foreground mb-2">
                        {activity.details}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-muted-foreground">
                      <span>{formatDate(activity.datum)}</span>
                      <span>•</span>
                      <span>{formatStunden(activity.zeitaufwand)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-muted-foreground text-center py-8">
                Keine Aktivitäten vorhanden
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

