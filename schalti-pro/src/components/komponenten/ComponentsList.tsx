"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KomponenteCard } from "./KomponenteCard";
import { KomponentenChecklisteDialog } from "./KomponentenChecklisteDialog";
import type { Komponente, KomponentenStatus } from "@/types";
import { CheckSquare2, Square, Check } from "lucide-react";

interface ComponentsListProps {
  komponenten: Komponente[];
  onKomponenteAbgeschlossen?: (komponente: Komponente) => void;
  onKomponentenChange?: (komponenten: Komponente[]) => void;
}

export function ComponentsList({
  komponenten: initialKomponenten,
  onKomponenteAbgeschlossen,
  onKomponentenChange,
}: ComponentsListProps) {
  // State für die Komponenten mit Status-Management
  const [komponenten, setKomponenten] = useState<Komponente[]>(initialKomponenten);
  // State für Mehrfachauswahl
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Ref um zu verhindern, dass der Callback doppelt aufgerufen wird
  const processedIds = useRef<Set<string>>(new Set());
  const prevKomponenten = useRef<Komponente[]>(initialKomponenten);
  // State für Checklisten-Dialog
  const [checklisteDialogOpen, setChecklisteDialogOpen] = useState(false);
  const [komponenteFuerCheckliste, setKomponenteFuerCheckliste] = useState<Komponente | null>(null);

  // Überwache Status-Änderungen und rufe Callback auf
  useEffect(() => {
    if (!onKomponenteAbgeschlossen) return;

    komponenten.forEach((komponente) => {
      const prevKomponente = prevKomponenten.current.find((k) => k.id === komponente.id);
      
      // Wenn Komponente von "ausstehend" zu "abgeschlossen" gewechselt ist
      if (
        prevKomponente &&
        prevKomponente.status === "ausstehend" &&
        komponente.status === "abgeschlossen" &&
        !processedIds.current.has(komponente.id)
      ) {
        processedIds.current.add(komponente.id);
        onKomponenteAbgeschlossen(komponente);
        
        // Nach kurzer Zeit wieder entfernen, falls Komponente zurückgesetzt wird
        setTimeout(() => {
          processedIds.current.delete(komponente.id);
        }, 1000);
      }
    });

    prevKomponenten.current = komponenten;
  }, [komponenten, onKomponenteAbgeschlossen]);

  // Aktualisiere State, wenn initialKomponenten sich ändern
  useEffect(() => {
    console.log("ComponentsList: initialKomponenten changed:", initialKomponenten);
    setKomponenten(initialKomponenten);
    prevKomponenten.current = initialKomponenten;
  }, [initialKomponenten]);

  // Bereinige Auswahl, wenn Komponenten nicht mehr ausstehend sind
  useEffect(() => {
    setSelectedIds((prev) => {
      const ausstehendIds = komponenten
        .filter((k) => k.status === "ausstehend")
        .map((k) => k.id);
      const newSet = new Set<string>();
      prev.forEach((id) => {
        if (ausstehendIds.includes(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [komponenten]);

  // Markiere Komponente als abgeschlossen (mit Checklisten-Prüfung)
  const markKomponenteAbgeschlossen = (komponente: Komponente) => {
    setKomponenten((prev) => {
      const updated = prev.map((k) => {
        if (k.id === komponente.id) {
          return {
            ...k,
            status: "abgeschlossen" as const,
          };
        }
        return k;
      });

      // Parent über Änderungen informieren
      if (onKomponentenChange) {
        onKomponentenChange(updated);
      }

      return updated;
    });
  };

  // Toggle Status beim Klick (nur wenn keine Checkbox angezeigt wird)
  const handleKomponenteClick = (komponenteId: string) => {
    const komponente = komponenten.find((k) => k.id === komponenteId);
    if (!komponente) return;

    // Wenn ausstehend und Checkbox-Modus aktiv, dann Checkbox togglen
    if (komponente.status === "ausstehend") {
      return; // Checkbox übernimmt die Auswahl
    }

    // Bei abgeschlossenen Komponenten: Status zurücksetzen (mit Bestätigung)
    if (komponente.status === "abgeschlossen") {
      if (!confirm("Komponente wirklich als ausstehend markieren?")) {
        return;
      }
      processedIds.current.delete(komponenteId);
    }

    setKomponenten((prev) => {
      const updated = prev.map((k) => {
        if (k.id === komponenteId) {
          return {
            ...k,
            status: (k.status === "ausstehend" ? "abgeschlossen" : "ausstehend") as KomponentenStatus,
          };
        }
        return k;
      });

      // Parent über Änderungen informieren
      if (onKomponentenChange) {
        onKomponentenChange(updated);
      }

      return updated;
    });
  };

  // Checkbox-Handler
  const handleCheckboxChange = (komponenteId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(komponenteId);
      } else {
        newSet.delete(komponenteId);
      }
      return newSet;
    });
  };

  // Alle ausstehenden Komponenten auswählen
  const handleSelectAll = () => {
    const ausstehendKomponenten = komponenten.filter((k) => k.status === "ausstehend");
    const ausstehendIds = ausstehendKomponenten.map((k) => k.id);
    setSelectedIds(new Set(ausstehendIds));
  };

  // Auswahl aufheben
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Prüfe ob Komponente Checkliste hat und öffne Dialog wenn nötig
  const handleKomponenteAbschließen = (komponente: Komponente) => {
    if (komponente.checklisteId) {
      // Komponente hat Checkliste - Dialog öffnen
      setKomponenteFuerCheckliste(komponente);
      setChecklisteDialogOpen(true);
    } else {
      // Keine Checkliste - direkt abschließen
      markKomponenteAbgeschlossen(komponente);
    }
  };

  // Callback wenn Checkliste vollständig abgearbeitet wurde
  const handleChecklisteComplete = () => {
    if (komponenteFuerCheckliste) {
      markKomponenteAbgeschlossen(komponenteFuerCheckliste);
      setKomponenteFuerCheckliste(null);
    }
  };

  // Ausgewählte Komponenten als abgeschlossen markieren
  const handleMarkSelectedAsCompleted = () => {
    if (selectedIds.size === 0) return;

    // Prüfe ob eine der ausgewählten Komponenten eine Checkliste hat
    const ausgewaehlteKomponenten = komponenten.filter(
      (k) => selectedIds.has(k.id) && k.status === "ausstehend"
    );

    // Wenn alle keine Checkliste haben, direkt abschließen
    const komponentenMitCheckliste = ausgewaehlteKomponenten.filter((k) => k.checklisteId);
    
    if (komponentenMitCheckliste.length === 0) {
      // Alle ohne Checkliste - direkt abschließen
      setKomponenten((prev) => {
        const updated = prev.map((k) => {
          if (selectedIds.has(k.id) && k.status === "ausstehend") {
            return {
              ...k,
              status: "abgeschlossen" as const,
            };
          }
          return k;
        });

        // Parent über Änderungen informieren
        if (onKomponentenChange) {
          onKomponentenChange(updated);
        }

        return updated;
      });

      // Auswahl zurücksetzen
      setSelectedIds(new Set());
    } else {
      // Mindestens eine Komponente hat Checkliste - nur die erste öffnen
      // (in einer echten App könnte man hier mehrere Dialoge nacheinander öffnen)
      const ersteMitCheckliste = komponentenMitCheckliste[0];
      setKomponenteFuerCheckliste(ersteMitCheckliste);
      setChecklisteDialogOpen(true);
      
      // Entferne diese Komponente aus der Auswahl
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ersteMitCheckliste.id);
        return newSet;
      });
      
      // Schließe die anderen ohne Checkliste direkt ab
      const andereOhneCheckliste = ausgewaehlteKomponenten.filter(
        (k) => k.id !== ersteMitCheckliste.id && !k.checklisteId
      );
      
      if (andereOhneCheckliste.length > 0) {
        setKomponenten((prev) => {
          const updated = prev.map((k) => {
            if (andereOhneCheckliste.some((k2) => k2.id === k.id) && k.status === "ausstehend") {
              return {
                ...k,
                status: "abgeschlossen" as const,
              };
            }
            return k;
          });

          // Parent über Änderungen informieren
          if (onKomponentenChange) {
            onKomponentenChange(updated);
          }

          return updated;
        });
      }
    }
  };

  // Group by status (neu sortiert nach Status-Änderung)
  const abgeschlossen = komponenten.filter((k) => k.status === "abgeschlossen");
  const ausstehend = komponenten.filter((k) => k.status === "ausstehend");
  const showCheckboxes = ausstehend.length > 0;
  const allSelected = showCheckboxes && selectedIds.size === ausstehend.length && ausstehend.length > 0;

  if (komponenten.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Komponenten</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-muted-foreground text-center py-8">
            Noch keine Komponenten vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komponenten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aktionsleiste für Mehrfachauswahl */}
        {showCheckboxes && (
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-muted rounded-lg border border-slate-200 dark:border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="gap-2"
              >
                {allSelected ? (
                  <>
                    <CheckSquare2 className="h-4 w-4" />
                    Auswahl aufheben
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Alle auswählen ({ausstehend.length})
                  </>
                )}
              </Button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-slate-600 dark:text-muted-foreground">
                  {selectedIds.size} ausgewählt
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleMarkSelectedAsCompleted}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Ausgewählte als abgeschlossen markieren ({selectedIds.size})
              </Button>
            )}
          </div>
        )}

        {/* Abgeschlossen */}
        {abgeschlossen.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-foreground mb-3">
              Abgeschlossen ({abgeschlossen.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {abgeschlossen.map((komponente) => (
                <KomponenteCard
                  key={komponente.id}
                  komponente={komponente}
                  onClick={() => handleKomponenteClick(komponente.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ausstehend */}
        {ausstehend.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-foreground mb-3">
              Ausstehend ({ausstehend.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {ausstehend.map((komponente) => (
                <KomponenteCard
                  key={komponente.id}
                  komponente={komponente}
                  isSelected={selectedIds.has(komponente.id)}
                  showCheckbox={true}
                  onCheckboxChange={(checked) =>
                    handleCheckboxChange(komponente.id, checked)
                  }
                  onClick={() => handleKomponenteClick(komponente.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Checklisten-Dialog */}
      {komponenteFuerCheckliste && (
        <KomponentenChecklisteDialog
          komponente={komponenteFuerCheckliste}
          open={checklisteDialogOpen}
          onOpenChange={setChecklisteDialogOpen}
          onComplete={handleChecklisteComplete}
        />
      )}
    </Card>
  );
}

