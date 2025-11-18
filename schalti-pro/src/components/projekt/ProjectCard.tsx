import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Projekt } from "@/types";
import { getStatusBadge, formatStunden } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  projekt: Projekt;
}

export function ProjectCard({ projekt }: ProjectCardProps) {
  const statusBadge = getStatusBadge(projekt.status);
  const progress = projekt.stats.gesamtKomponenten > 0
    ? (projekt.stats.komponenten / projekt.stats.gesamtKomponenten) * 100
    : 0;

  return (
    <Link href={`/projekte/${projekt.id}`}>
      <Card className="p-4 md:p-4 lg:p-4 xl:p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer">
        <div className="mb-3 md:mb-3 lg:mb-3 xl:mb-4">
          {/* Header mit Titel und Badge - Badge rechts auf Desktop, unter Titel auf Tablet */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-base lg:text-base xl:text-xl font-bold text-slate-900 dark:text-foreground mb-1 break-words">
                {projekt.name}
              </h3>
            </div>
            <Badge
              className={cn(
                "border flex-shrink-0 text-xs px-2.5 py-1 w-fit md:w-auto",
                statusBadge.className
              )}
            >
              {statusBadge.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-muted-foreground break-words">
            {projekt.standort}
          </p>
          {projekt.schaltschrankNummer && (
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1 font-mono">
              Schaltschrank: {projekt.schaltschrankNummer}
            </p>
          )}
        </div>

        <div className="space-y-2 md:space-y-2 lg:space-y-2 xl:space-y-3">
          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="min-w-0">
              <div className="text-slate-600 dark:text-muted-foreground mb-0.5">Stunden</div>
              <div className="font-semibold text-slate-900 dark:text-foreground truncate">
                {formatStunden(projekt.stats.stunden)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-slate-600 dark:text-muted-foreground mb-0.5">Einträge</div>
              <div className="font-semibold text-slate-900 dark:text-foreground truncate">
                {projekt.stats.eintraege}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-muted-foreground mb-1">
              <span>Komponenten</span>
              <span>
                {projekt.stats.komponenten} / {projekt.stats.gesamtKomponenten}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

