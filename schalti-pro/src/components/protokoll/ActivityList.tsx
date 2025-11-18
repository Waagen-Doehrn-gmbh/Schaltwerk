import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Arbeitsprotokoll, Komponente } from "@/types";
import { formatDate, formatStunden, getAvatarUrl, getDisplayName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ActivityListProps {
  protokolle: Arbeitsprotokoll[];
  komponenten?: Komponente[];
}

export function ActivityList({ protokolle, komponenten = [] }: ActivityListProps) {
  if (protokolle.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-muted-foreground text-center py-8">
            Noch keine Aktivitäten vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-border" />

          {/* Timeline Items */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {protokolle.map((protokoll, index) => (
              <div key={protokoll.id} className="relative flex gap-4">
                {/* Avatar on line */}
                <div className="relative z-10">
                  <Avatar className="border-2 border-white bg-blue-500">
                    {protokoll.user && getAvatarUrl(protokoll.user.id) && (
                      <AvatarImage 
                        src={getAvatarUrl(protokoll.user.id)} 
                        alt={protokoll.user.name} 
                      />
                    )}
                    <AvatarFallback className="text-white text-xs">
                      {protokoll.user?.initialen || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 pb-6 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-foreground text-sm md:text-sm lg:text-sm xl:text-base break-words">
                      {protokoll.user ? getDisplayName(protokoll.user.id, protokoll.user.name) : "Unbekannt"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0 px-2.5 py-1 w-fit"
                    >
                      {formatStunden(protokoll.zeitaufwand)}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 mb-1">
                    <p className="font-medium text-slate-900 dark:text-foreground text-sm md:text-sm lg:text-sm xl:text-base break-words flex-1">
                      {protokoll.aufgabe}
                    </p>
                    {protokoll.abnahmeStatus && (
                      <Badge
                        className={cn(
                          "text-xs flex-shrink-0",
                          protokoll.abnahmeStatus === "bestanden"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {protokoll.abnahmeStatus === "bestanden" ? "✓ Bestanden" : "✗ Verweigert"}
                        {protokoll.abnahmeTyp && (
                          <span className="ml-1 text-xs">
                            ({protokoll.abnahmeTyp === "technisch" ? "Technisch" : "Endabnahme"})
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>
                  {protokoll.details && (
                    <p className="text-xs md:text-xs lg:text-xs xl:text-sm text-slate-600 dark:text-muted-foreground mb-2 break-words">
                      {protokoll.details}
                    </p>
                  )}
                  {protokoll.abnahmeCheckliste && protokoll.abnahmeCheckliste.length > 0 && (
                    <div className="mb-2 p-2 bg-slate-50 dark:bg-muted rounded border border-slate-200 dark:border-border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-foreground">
                          Checkliste: {protokoll.abnahmeCheckliste.filter((item) => item.checked).length} / {protokoll.abnahmeCheckliste.length} erfüllt
                        </p>
                        {protokoll.checklisteStatus && (
                          <Badge
                            className={cn(
                              "text-xs",
                              protokoll.checklisteStatus === "abgeschlossen"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            )}
                          >
                            {protokoll.checklisteStatus === "abgeschlossen" ? "Abgeschlossen" : "Teilabschluss"}
                          </Badge>
                        )}
                      </div>
                      {/* Checklisten-Punkte mit Details */}
                      {(protokoll.abnahmeStatus === "verweigert" || protokoll.checklisteStatus === "teilabschluss") && (
                        <div className="mt-2 space-y-2">
                          {protokoll.abnahmeCheckliste
                            .filter((item) => !item.checked)
                            .map((item) => (
                              <div key={item.id} className="border-l-2 border-red-200 pl-2">
                                <p className="text-xs font-medium text-red-700">{item.text}</p>
                                {/* Bilder für diesen Punkt */}
                                {item.bilder && item.bilder.length > 0 && (
                                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {item.bilder.map((bildUrl, bildIndex) => (
                                      <div key={bildIndex} className="relative">
                                        <img
                                          src={bildUrl}
                                          alt={`Bild ${bildIndex + 1} für ${item.text}`}
                                          className="w-full h-16 object-cover rounded border border-slate-200 dark:border-border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            window.open(bildUrl, "_blank");
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                      
                      {/* Alle Punkte mit Bildern anzeigen (nur wenn keine nicht erfüllten Punkte vorhanden, z.B. bei bestandener Abnahme) */}
                      {protokoll.abnahmeCheckliste.some((item) => item.bilder && item.bilder.length > 0) &&
                        !protokoll.abnahmeCheckliste.some((item) => !item.checked) && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-border">
                          <p className="text-xs font-medium text-slate-700 dark:text-foreground mb-1">Hinzugefügte Bilder:</p>
                          <div className="space-y-2">
                            {protokoll.abnahmeCheckliste
                              .filter((item) => item.bilder && item.bilder.length > 0)
                              .map((item) => (
                                <div key={item.id} className="space-y-1">
                                  <p className="text-xs text-slate-600 dark:text-muted-foreground font-medium">{item.text}:</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {item.bilder!.map((bildUrl, bildIndex) => (
                                      <div key={bildIndex} className="relative">
                                        <img
                                          src={bildUrl}
                                          alt={`Bild ${bildIndex + 1} für ${item.text}`}
                                          className="w-full h-16 object-cover rounded border border-slate-200 dark:border-border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            window.open(bildUrl, "_blank");
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {protokoll.abgeschlosseneKomponentenIds && protokoll.abgeschlosseneKomponentenIds.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1.5">
                        Eingebaute Komponenten ({protokoll.abgeschlosseneKomponentenIds.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {protokoll.abgeschlosseneKomponentenIds.map((komponenteId) => {
                          const komponente = komponenten.find((k) => k.id === komponenteId);
                          return (
                            <Badge
                              key={komponenteId}
                              variant="outline"
                              className="text-xs bg-white text-blue-700 border-blue-300"
                            >
                              {komponente ? `${komponente.name} (${komponente.artikelNummer})` : komponenteId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    {formatDate(protokoll.datum)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

