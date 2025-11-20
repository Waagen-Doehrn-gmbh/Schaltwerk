"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KomponenteCard } from "./KomponenteCard";
import { KomponentenChecklisteInline } from "./KomponentenChecklisteInline";
import type { Komponente, KomponentenStatus, User } from "@/types";
import { CheckSquare2, Square, Check } from "lucide-react";
import { useMe } from "@/lib/hooks";

interface ComponentsListProps {
  komponenten: Komponente[];
  onKomponenteAbgeschlossen?: (komponente: Komponente) => void;
  onKomponentenChange?: (komponenten: Komponente[]) => void;
  onKomponenteStatusChange?: (komponenteId: string, status: KomponentenStatus) => void;
  currentUser?: User | null;
}

export function ComponentsList({
  komponenten: initialKomponenten,
  onKomponenteAbgeschlossen,
  onKomponentenChange,
  onKomponenteStatusChange,
  currentUser: propCurrentUser,
}: ComponentsListProps) {
  // State für die Komponenten mit Status-Management
  const [komponenten, setKomponenten] = useState<Komponente[]>(initialKomponenten);
  // State für Mehrfachauswahl
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Ref um zu verhindern, dass der Callback doppelt aufgerufen wird
  const processedIds = useRef<Set<string>>(new Set());
  const prevKomponenten = useRef<Komponente[]>(initialKomponenten);
  // State für ausklappbare Checklisten (Komponenten-IDs)
  const [expandedKomponentenIds, setExpandedKomponentenIds] = useState<Set<string>>(new Set());
  
  // Hole aktuellen Benutzer (falls nicht als Prop übergeben)
  const { data: hookCurrentUser } = useMe();
  const currentUser = propCurrentUser ?? hookCurrentUser;
  
  // Hilfsfunktion: Prüft ob Benutzer mindestens "technische_abnahme" Berechtigung hat
  const kannKomponenteZuruecksetzen = (): boolean => {
    if (!currentUser) return false;
    
    // Admin hat immer alle Berechtigungen
    if (currentUser.rolle === "admin") return true;
    
    // Hierarchie: admin > analyse > endabnahme > technische_abnahme > monteur
    const rollenHierarchie: Record<string, number> = {
      monteur: 1,
      technische_abnahme: 2,
      endabnahme: 3,
      analyse: 4,
      admin: 5,
    };
    
    const userLevel = rollenHierarchie[currentUser.rolle] || 0;
    const erforderlichLevel = rollenHierarchie["technische_abnahme"] || 0;
    
    return userLevel >= erforderlichLevel;
  };

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
      
      // Wenn Komponente von "abgeschlossen" zu "ausstehend" zurückgesetzt wurde
      if (
        prevKomponente &&
        prevKomponente.status === "abgeschlossen" &&
        komponente.status === "ausstehend"
      ) {
        // Entferne aus processedIds, damit sie wieder abgeschlossen werden kann
        processedIds.current.delete(komponente.id);
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

    // Wenn ausstehend, dann prüfe ob Checkliste vorhanden ist
    if (komponente.status === "ausstehend") {
      // Wenn Komponente eine Checkliste hat, klappe sie nur aus/ein (ohne Checkbox zu aktivieren)
      if (komponente.checklisteId) {
        setExpandedKomponentenIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(komponenteId)) {
            newSet.delete(komponenteId);
          } else {
            newSet.add(komponenteId);
          }
          return newSet;
        });
        return; // Nur Checkliste ausklappen, keine Checkbox-Aktivierung
      }
      
      // Wenn keine Checkliste vorhanden ist, dann Checkbox umschalten
      const isCurrentlySelected = selectedIds.has(komponenteId);
      const newCheckedState = !isCurrentlySelected;
      
      // Aktualisiere Checkbox-Auswahl
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newCheckedState) {
          newSet.add(komponenteId);
        } else {
          newSet.delete(komponenteId);
        }
        return newSet;
      });
      return;
    }

    // Bei abgeschlossenen Komponenten: Status zurücksetzen (mit Berechtigungsprüfung)
    if (komponente.status === "abgeschlossen") {
      // Prüfe Berechtigung
      if (!kannKomponenteZuruecksetzen()) {
        alert("Sie haben keine Berechtigung, abgeschlossene Komponenten zurückzusetzen. Mindestens die Rolle 'Technische Abnahme' ist erforderlich.");
        return;
      }
      
      if (!confirm("Komponente wirklich als ausstehend markieren?")) {
        return;
      }
      processedIds.current.delete(komponenteId);
    }

    setKomponenten((prev) => {
      const updated = prev.map((k) => {
        if (k.id === komponenteId) {
          const newStatus = (k.status === "ausstehend" ? "abgeschlossen" : "ausstehend") as KomponentenStatus;
          
          // Informiere Parent über Status-Änderung (für Server-Sync)
          if (onKomponenteStatusChange) {
            onKomponenteStatusChange(komponenteId, newStatus);
          }
          
          return {
            ...k,
            status: newStatus,
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

  // Checkbox-Handler (nur für Mehrfachauswahl über die Aktionsleiste)
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
    // Keine automatische Checkliste-Anzeige - nur für Mehrfachauswahl
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

  // Callback wenn Checkliste vollständig abgearbeitet wurde
  const handleChecklisteComplete = (komponenteId: string) => {
    const komponente = komponenten.find((k) => k.id === komponenteId);
    if (komponente) {
      markKomponenteAbgeschlossen(komponente);
      // Checkliste einklappen nach Abschluss
      setExpandedKomponentenIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(komponenteId);
        return newSet;
      });
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
      // Mindestens eine Komponente hat Checkliste - klappe die erste aus
      const ersteMitCheckliste = komponentenMitCheckliste[0];
      setExpandedKomponentenIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(ersteMitCheckliste.id);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-50 dark:bg-muted rounded-lg border border-slate-200 dark:border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="gap-2"
              >
                {allSelected ? (
                  <>
                    <CheckSquare2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Auswahl aufheben</span>
                    <span className="sm:hidden">Aufheben</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span className="hidden sm:inline">Alle auswählen ({ausstehend.length})</span>
                    <span className="sm:hidden">Alle ({ausstehend.length})</span>
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
                className="gap-2 w-full sm:w-auto"
              >
                <Check className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Ausgewählte als abgeschlossen markieren ({selectedIds.size})</span>
                <span className="sm:hidden">Abgeschlossen ({selectedIds.size})</span>
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
              {abgeschlossen.map((komponente) => {
                const kannZuruecksetzen = kannKomponenteZuruecksetzen();
                return (
                  <KomponenteCard
                    key={komponente.id}
                    komponente={komponente}
                    onClick={kannZuruecksetzen ? () => handleKomponenteClick(komponente.id) : undefined}
                    disabled={!kannZuruecksetzen}
                  />
                );
              })}
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
                <div key={komponente.id}>
                  <KomponenteCard
                    komponente={komponente}
                    isSelected={selectedIds.has(komponente.id)}
                    showCheckbox={true}
                    onCheckboxChange={(checked) =>
                      handleCheckboxChange(komponente.id, checked)
                    }
                    onClick={() => handleKomponenteClick(komponente.id)}
                  />
                  {expandedKomponentenIds.has(komponente.id) && komponente.checklisteId && (
                    <KomponentenChecklisteInline
                      key={`checkliste-${komponente.id}-${komponente.checklisteId}`}
                      komponente={komponente}
                      onComplete={() => handleChecklisteComplete(komponente.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

