"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { AbnahmeChecklisteItem, Komponente, Checkliste } from "@/types";
import { cn } from "@/lib/utils";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import { filterDeletedFallbackChecklisten } from "@/lib/checklisten-fallback";
import { useKomponenten } from "@/lib/hooks";

// Diese Funktion wird nicht mehr verwendet - wir verwenden direkt white-space: pre-line

interface AufgabenChecklisteProps {
  checkliste: AbnahmeChecklisteItem[];
  onChecklisteChange: (checkliste: AbnahmeChecklisteItem[]) => void;
  titel?: string;
  komponenten?: Komponente[]; // Verfügbare Komponenten
  onKomponenteAktualisieren?: (komponenteId: string, status: "abgeschlossen", viaCheckliste: boolean) => void;
  getKomponentenChecklistenStatus?: React.MutableRefObject<(() => { vollstaendig: boolean; unvollstaendige: string[] }) | null>;
  getVerfuegbareCheckliste?: React.MutableRefObject<(() => AbnahmeChecklisteItem[]) | null>;
}

// Fallback: Komponenten-spezifische Checklisten (in einer echten App würde dies aus der DB kommen)
const getKomponentenChecklisten = (): Checkliste[] => {
  return [
    {
      id: "checkliste-zeitschaltuhr",
      name: "Zeitschaltuhr - Hinweise",
      typ: "allgemein",
      items: [
        {
          id: "zt-1",
          text: "Uhrzeit korrekt eingestellt",
        },
        {
          id: "zt-2",
          text: "Wochentage korrekt programmiert",
        },
        {
          id: "zt-3",
          text: "Schaltzeiten überprüft",
        },
      ],
    },
  ];
};

export function AufgabenCheckliste({
  checkliste,
  onChecklisteChange,
  titel = "Checkliste",
  komponenten = [],
  onKomponenteAktualisieren,
  getKomponentenChecklistenStatus,
  getVerfuegbareCheckliste,
}: AufgabenChecklisteProps) {
  const checklistenContext = useChecklistenOptional();
  const allChecklisten = checklistenContext?.checklisten || [];
  // Lade alle Komponenten, um Komponenten-Namen im Text zu finden
  const { data: alleKomponenten = [] } = useKomponenten();
  const komponentenChecklisten = useMemo(() => {
    const all = getKomponentenChecklisten();
    return filterDeletedFallbackChecklisten(all);
  }, []);
  const allAvailableChecklisten = useMemo(
    () => [...allChecklisten, ...komponentenChecklisten],
    [allChecklisten, komponentenChecklisten]
  );

  // Alle Items anzeigen, aber Text dynamisch filtern
  // Items mit komponenteIds werden nur angezeigt, wenn mindestens eine Komponente im Projekt ist
  // Items ohne Komponenten-Verknüpfung werden immer angezeigt
  // WICHTIG: useMemo mit Dependencies, damit die Liste neu berechnet wird, wenn sich komponenten oder alleKomponenten ändern
  const verfuegbareCheckliste = useMemo(() => {
    // Funktion: Filtert Komponenten aus dem Text, die nicht im Projekt vorhanden sind
    // (Definiert innerhalb useMemo, damit sie Zugriff auf aktuelle komponenten und alleKomponenten hat)
    const filterKomponentenAusTextMemo = (text: string): string => {
      if (!text || text.trim() === "") return text;
      
      const lines = text.split('\n');
      const gefilterteLines: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          gefilterteLines.push(line);
          continue;
        }
        
        // Suche nach Pattern wie "1x Komponentenname" oder "X3 1x Komponentenname"
        // Pattern: Optional "X3" am Anfang, dann optional "1x" oder "2x" etc., dann Komponentenname, optional mit (Artikelnummer)
        // Beispiel: "X3 1x Thermostat Kühlen" oder "1x Thermostat Kühlen"
        const match = trimmedLine.match(/^(X\d+\s+)?(\d+x\s+)?(.+?)(?:\s*\([^)]+\))?\s*$/);
        if (match && match[3]) {
          const komponentenName = match[3].trim();
          
          if (komponentenName.length > 2) {
            // Suche Komponente in der Gesamtliste (alle Komponenten)
            // Verwende exakte Übereinstimmung oder Teilstring-Matching
            const gefundeneKomponente = alleKomponenten.find((k) => {
              const komponentenNameLower = k.name.toLowerCase().trim();
              const nameLower = komponentenName.toLowerCase().trim();
              
              // Exakte Übereinstimmung (höchste Priorität)
              if (komponentenNameLower === nameLower) {
                return true;
              }
              
              // Name ist exakt Teil des Komponenten-Namens (z.B. "Thermostat Kühlen" in "Thermostat Kühlen 400W")
              // Prüfe ob der Text-Name am Anfang des Komponenten-Namens steht
              if (komponentenNameLower.startsWith(nameLower + " ") || komponentenNameLower === nameLower) {
                return true;
              }
              
              // Komponenten-Name ist exakt Teil des Text-Namens (z.B. "Thermostat Kühlen" enthält "Thermostat")
              // Aber nur wenn der Komponenten-Name am Anfang steht
              if (nameLower.startsWith(komponentenNameLower + " ") || nameLower === komponentenNameLower) {
                return true;
              }
              
              // Fallback: Teilstring-Matching (weniger präzise, aber für ähnliche Namen)
              // Nur wenn beide Namen mindestens 5 Zeichen lang sind
              if (nameLower.length >= 5 && komponentenNameLower.length >= 5) {
                if (komponentenNameLower.includes(nameLower) || nameLower.includes(komponentenNameLower)) {
                  return true;
                }
              }
              
              return false;
            });
            
            // Prüfe ob Komponente im Projekt vorhanden ist
            if (gefundeneKomponente) {
              const komponenteId = String(gefundeneKomponente.id).trim();
              const istImProjekt = komponenten.some((projektK) => {
                const projektKomponenteId = String(projektK.id).trim();
                return projektKomponenteId === komponenteId;
              });
              
              // Nur hinzufügen wenn Komponente im Projekt vorhanden ist
              if (istImProjekt) {
                gefilterteLines.push(line);
              }
              // Sonst: Zeile nicht hinzufügen (Komponente nicht im Projekt)
            } else {
              // Komponente nicht in der Gesamtliste gefunden
              // Zeile immer beibehalten - könnte allgemeiner Text sein (z.B. "2x Potentialausgleisschiene")
              // Die Filterung wird nur angewendet, wenn eine Komponente gefunden wurde, aber nicht im Projekt ist
              gefilterteLines.push(line);
            }
          } else {
            // Kein Komponenten-Name erkannt - Zeile beibehalten
            gefilterteLines.push(line);
          }
        } else {
          // Kein Pattern erkannt - Zeile beibehalten
          gefilterteLines.push(line);
        }
      }
      
      return gefilterteLines.join('\n');
    };

    return checkliste
      .map((item) => {
        // Prüfe welche Komponenten-Verknüpfungen vorhanden sind
        const hasKomponenteIds = item.komponenteIds && Array.isArray(item.komponenteIds) && item.komponenteIds.length > 0;
        const hasKomponenteId = item.komponenteId && item.komponenteId.trim() !== "";
        const hasArtikelNummer = item.artikelNummer && item.artikelNummer.trim() !== "";
        
        // Wenn Komponenten über IDs zugeordnet sind, prüfe ob diese im Projekt vorhanden sind
        if (hasKomponenteIds) {
          // Prüfe ob mindestens eine der zugeordneten Komponenten in der Projekt-Komponenten-Liste vorhanden ist
          const hatKomponenteImProjekt = item.komponenteIds!.some((id) => {
            if (!id || id.trim() === "") return false;
            const itemId = String(id).trim();
            return komponenten.some((k) => String(k.id).trim() === itemId);
          });
          
          // Nur anzeigen wenn mindestens eine Komponente im Projekt vorhanden ist
          if (!hatKomponenteImProjekt) {
            return null; // Item ausblenden
          }
        }
        
        // Rückwärtskompatibilität: einzelne komponenteId
        if (hasKomponenteId) {
          const itemId = String(item.komponenteId).trim();
          const gefunden = komponenten.some((k) => String(k.id).trim() === itemId);
          if (!gefunden) {
            return null; // Item ausblenden
          }
        }
        
        // Rückwärtskompatibilität: artikelNummer
        if (hasArtikelNummer) {
          const artikelNr = item.artikelNummer.trim();
          const gefunden = komponenten.some((k) => k.artikelNummer && k.artikelNummer.trim() === artikelNr);
          if (!gefunden) {
            return null; // Item ausblenden
          }
        }
        
        // Filtere Text: Entferne Komponenten, die nicht im Projekt sind
        // WICHTIG: Nur Text-Filterung anwenden, wenn explizite Komponenten-Verknüpfungen vorhanden sind
        // Items ohne explizite Verknüpfung werden immer vollständig angezeigt (z.B. "2x Potentialausgleisschiene")
        let gefilterterText = item.text;
        if (hasKomponenteIds || hasKomponenteId || hasArtikelNummer) {
          // Nur filtern wenn explizite Komponenten-Verknüpfungen vorhanden sind
          // (der Text kann zusätzliche Komponenten enthalten, die nicht über IDs zugeordnet sind)
          gefilterterText = filterKomponentenAusTextMemo(item.text);
        }
        
        // Wenn nach Filterung kein Text mehr übrig ist, Item ausblenden
        if (!gefilterterText || gefilterterText.trim() === "") {
          return null;
        }
        
        // Item mit gefiltertem Text zurückgeben
        return {
          ...item,
          text: gefilterterText,
        };
      })
      .filter((item): item is AbnahmeChecklisteItem => item !== null);
  }, [checkliste, komponenten, alleKomponenten]);

  // Exponiere die gefilterte Checkliste über Ref
  useEffect(() => {
    if (getVerfuegbareCheckliste) {
      getVerfuegbareCheckliste.current = () => verfuegbareCheckliste;
    }
    // getVerfuegbareCheckliste ist ein Ref und ändert sich nicht, daher nicht in Dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verfuegbareCheckliste]);

  // Finde Komponenten mit eigenen Checklisten, die in der Aufgaben-Checkliste abgehakt wurden
  const komponentenMitChecklisten = useMemo(() => {
    const result: Array<{ komponente: Komponente; checklisteTemplate: Checkliste }> = [];
    
    verfuegbareCheckliste.forEach((item) => {
      if (item.checked) {
        // Unterstütze komponenteIds Array (neu)
        if (item.komponenteIds && item.komponenteIds.length > 0) {
          item.komponenteIds.forEach((komponenteId) => {
            const komponente = komponenten.find((k) => k.id === komponenteId);
            if (komponente && komponente.checklisteId) {
              const checklisteTemplate = allAvailableChecklisten.find(
                (c) => c.id === komponente.checklisteId
              );
              if (checklisteTemplate) {
                // Prüfe ob bereits hinzugefügt
                if (!result.some((r) => r.komponente.id === komponente.id)) {
                  result.push({ komponente, checklisteTemplate });
                }
              }
            }
          });
        }
        // Rückwärtskompatibilität: einzelne komponenteId
        else if (item.komponenteId) {
          const komponente = komponenten.find((k) => k.id === item.komponenteId);
          if (komponente && komponente.checklisteId) {
            const checklisteTemplate = allAvailableChecklisten.find(
              (c) => c.id === komponente.checklisteId
            );
            if (checklisteTemplate) {
              // Prüfe ob bereits hinzugefügt
              if (!result.some((r) => r.komponente.id === komponente.id)) {
                result.push({ komponente, checklisteTemplate });
              }
            }
          }
        }
        // Rückwärtskompatibilität: artikelNummer
        else if (item.artikelNummer) {
          const komponente = komponenten.find((k) => k.artikelNummer === item.artikelNummer);
          if (komponente && komponente.checklisteId) {
            const checklisteTemplate = allAvailableChecklisten.find(
              (c) => c.id === komponente.checklisteId
            );
            if (checklisteTemplate) {
              // Prüfe ob bereits hinzugefügt
              if (!result.some((r) => r.komponente.id === komponente.id)) {
                result.push({ komponente, checklisteTemplate });
              }
            }
          }
        }
      }
    });
    
    return result;
  }, [verfuegbareCheckliste, komponenten, allAvailableChecklisten]);

  // State für Komponenten-Checklisten
  const [komponentenChecklistenState, setKomponentenChecklistenState] = useState<
    Record<string, AbnahmeChecklisteItem[]>
  >({});

  // Initialisiere Komponenten-Checklisten
  useEffect(() => {
    setKomponentenChecklistenState((prev) => {
      const newState: Record<string, AbnahmeChecklisteItem[]> = { ...prev };
      let hasChanges = false;
      
      komponentenMitChecklisten.forEach(({ komponente, checklisteTemplate }) => {
        if (!newState[komponente.id]) {
          // Initialisiere nur wenn noch nicht vorhanden
          newState[komponente.id] = checklisteTemplate.items.map((item) => ({
            ...item,
            checked: false,
          }));
          hasChanges = true;
        }
      });
      
      // WICHTIG: Entferne State NUR für Komponenten, die nicht mehr in der Liste sind
      // UND deren zugehöriges Checklisten-Item nicht mehr gecheckt ist
      // Das verhindert, dass die Checkliste entfernt wird, wenn die Komponente abgeschlossen wird
      const aktuelleIds = new Set(komponentenMitChecklisten.map(({ komponente }) => komponente.id));
      Object.keys(newState).forEach((id) => {
        if (!aktuelleIds.has(id)) {
          // Prüfe ob das zugehörige Checklisten-Item noch gecheckt ist
          const itemNochGecheckt = verfuegbareCheckliste.some(
            (item) => {
              // Unterstütze komponenteIds Array
              if (item.komponenteIds && item.komponenteIds.includes(id)) {
                return item.checked;
              }
              // Rückwärtskompatibilität: einzelne komponenteId
              if (item.komponenteId === id) {
                return item.checked;
              }
              // Rückwärtskompatibilität: artikelNummer
              if (item.artikelNummer && komponenten.find(k => k.id === id)?.artikelNummer === item.artikelNummer) {
                return item.checked;
              }
              return false;
            }
          );
          
          // Nur entfernen wenn Item nicht mehr gecheckt ist
          if (!itemNochGecheckt) {
            delete newState[id];
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? newState : prev;
    });
  }, [komponentenMitChecklisten, verfuegbareCheckliste, komponenten]); // Abhängigkeiten erweitert

  // Prüfe ob alle Komponenten-Checklisten vollständig sind
  const alleKomponentenChecklistenVollstaendig = useMemo(() => {
    // Wenn keine Komponenten mit Checklisten vorhanden sind, gilt es als vollständig
    if (komponentenMitChecklisten.length === 0) {
      return true;
    }
    
    return komponentenMitChecklisten.every(({ komponente }) => {
      const komponenteCheckliste = komponentenChecklistenState[komponente.id];
      // Wenn Checkliste nicht initialisiert ist oder leer, gilt als unvollständig
      if (!komponenteCheckliste || komponenteCheckliste.length === 0) {
        return false;
      }
      // Prüfe ob alle Items abgehakt sind
      return komponenteCheckliste.every((item) => item.checked);
    });
  }, [komponentenMitChecklisten, komponentenChecklistenState]);

  // Finde unvollständige Komponenten-Checklisten
  const unvollstaendigeKomponenten = useMemo(() => {
    return komponentenMitChecklisten
      .filter(({ komponente }) => {
        const komponenteCheckliste = komponentenChecklistenState[komponente.id];
        // Wenn Checkliste nicht initialisiert ist oder leer, gilt als unvollständig
        if (!komponenteCheckliste || komponenteCheckliste.length === 0) {
          return true;
        }
        // Prüfe ob alle Items abgehakt sind
        return !komponenteCheckliste.every((item) => item.checked);
      })
      .map(({ komponente }) => komponente.name);
  }, [komponentenMitChecklisten, komponentenChecklistenState]);

  // Exponiere Funktion für Parent zum Abrufen des Status (wird nur beim Submit aufgerufen)
  // Verwende String-Vergleich für Array, um unnötige Updates zu vermeiden
  const unvollstaendigeKomponentenString = useMemo(
    () => unvollstaendigeKomponenten.join(","),
    [unvollstaendigeKomponenten]
  );
  
  useEffect(() => {
    if (getKomponentenChecklistenStatus) {
      getKomponentenChecklistenStatus.current = () => ({
        vollstaendig: alleKomponentenChecklistenVollstaendig,
        unvollstaendige: unvollstaendigeKomponenten,
      });
    }
    // getKomponentenChecklistenStatus ist ein Ref und ändert sich nicht, daher nicht in Dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alleKomponentenChecklistenVollstaendig, unvollstaendigeKomponentenString]);

  const handleKomponenteChecklisteChange = (
    komponenteId: string,
    neueCheckliste: AbnahmeChecklisteItem[]
  ) => {
    setKomponentenChecklistenState((prev) => ({
      ...prev,
      [komponenteId]: neueCheckliste,
    }));
  };

  const handleToggle = (itemId: string) => {
    const item = checkliste.find((i) => i.id === itemId);
    if (!item) return;
    
    const wasChecked = item.checked;
    const updated = checkliste.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    onChecklisteChange(updated);
    
    // Wenn abgehakt wird (von false zu true) UND Komponenten verknüpft sind
    if (!wasChecked && onKomponenteAktualisieren) {
      // Unterstütze komponenteIds Array (neu)
      if (item.komponenteIds && item.komponenteIds.length > 0) {
        item.komponenteIds.forEach((komponenteId) => {
          const komponente = komponenten.find((k) => k.id === komponenteId);
          if (komponente) {
            // Prüfe ob Komponente eine Checkliste hat
            if (komponente.checklisteId) {
              // Komponente hat Checkliste - wird später über Komponenten-Checkliste abgeschlossen
              // NICHTS tun hier - die Checkliste wird angezeigt und muss erst vollständig sein
            } else {
              // Komponente hat keine Checkliste - sofort abschließen
              onKomponenteAktualisieren(komponente.id, "abgeschlossen", true);
            }
          }
        });
      }
      // Rückwärtskompatibilität: einzelne komponenteId
      else if (item.komponenteId) {
        const komponente = komponenten.find((k) => k.id === item.komponenteId);
        if (komponente) {
          // Prüfe ob Komponente eine Checkliste hat
          if (komponente.checklisteId) {
            // Komponente hat Checkliste - NIE sofort abschließen
            // Die Komponente wird erst abgeschlossen, wenn die Komponenten-Checkliste vollständig ist
            // (siehe handleKomponenteToggle)
            // NICHTS tun hier - die Checkliste wird angezeigt und muss erst vollständig sein
          } else {
            // Komponente hat keine Checkliste - sofort abschließen
            onKomponenteAktualisieren(komponente.id, "abgeschlossen", true);
          }
        }
      }
      // Rückwärtskompatibilität: artikelNummer
      else if (item.artikelNummer) {
        const komponente = komponenten.find((k) => k.artikelNummer === item.artikelNummer);
        if (komponente) {
          // Prüfe ob Komponente eine Checkliste hat
          if (komponente.checklisteId) {
            // Komponente hat Checkliste - NIE sofort abschließen
            // Die Komponente wird erst abgeschlossen, wenn die Komponenten-Checkliste vollständig ist
            // (siehe handleKomponenteToggle)
            // NICHTS tun hier - die Checkliste wird angezeigt und muss erst vollständig sein
          } else {
            // Komponente hat keine Checkliste - sofort abschließen
            onKomponenteAktualisieren(komponente.id, "abgeschlossen", true);
          }
        }
      }
    }
  };

  const allChecked = verfuegbareCheckliste.every((item) => item.checked);
  const checkedCount = verfuegbareCheckliste.filter((item) => item.checked).length;
  const hatKomponentenChecklisten = komponentenMitChecklisten.length > 0;
  const allesVollstaendig = allChecked && (hatKomponentenChecklisten ? alleKomponentenChecklistenVollstaendig : true);

  // Finde Komponente für ein Checklisten-Item
  const findKomponenteFuerItem = (item: AbnahmeChecklisteItem): { komponente: Komponente; checklisteTemplate: Checkliste } | null => {
    if (!item.checked) return null;
    
    // Unterstütze komponenteIds Array (verwende erste Komponente mit Checkliste)
    if (item.komponenteIds && item.komponenteIds.length > 0) {
      for (const komponenteId of item.komponenteIds) {
        const komponente = komponenten.find((k) => k.id === komponenteId);
        if (komponente && komponente.checklisteId) {
          const checklisteTemplate = allAvailableChecklisten.find(
            (c) => c.id === komponente.checklisteId
          );
          if (checklisteTemplate) {
            return { komponente, checklisteTemplate };
          }
        }
      }
      return null;
    }
    
    // Rückwärtskompatibilität: einzelne komponenteId
    let komponente: Komponente | undefined;
    if (item.komponenteId) {
      komponente = komponenten.find((k) => k.id === item.komponenteId);
    } else if (item.artikelNummer) {
      komponente = komponenten.find((k) => k.artikelNummer === item.artikelNummer);
    }
    
    if (komponente && komponente.checklisteId) {
      const checklisteTemplate = allAvailableChecklisten.find(
        (c) => c.id === komponente.checklisteId
      );
      if (checklisteTemplate) {
        return { komponente, checklisteTemplate };
      }
    }
    
    return null;
  };

  // Render-Funktion für eine Checkliste
  const renderCheckliste = (items: AbnahmeChecklisteItem[], onToggle: (itemId: string) => void) => (
    <div className="space-y-3">
      {items.map((item) => {
        const komponenteInfo = findKomponenteFuerItem(item);
        const komponenteCheckliste = komponenteInfo 
          ? (komponentenChecklistenState[komponenteInfo.komponente.id] || [])
          : null;
        const komponenteAllChecked = komponenteCheckliste 
          ? komponenteCheckliste.length > 0 && komponenteCheckliste.every((i) => i.checked)
          : true;
        const komponenteCheckedCount = komponenteCheckliste 
          ? komponenteCheckliste.filter((i) => i.checked).length 
          : 0;

        const handleKomponenteToggle = (komponenteItemId: string) => {
          if (!komponenteInfo) return;
          const updated = komponenteCheckliste!.map((i) =>
            i.id === komponenteItemId ? { ...i, checked: !i.checked } : i
          );
          handleKomponenteChecklisteChange(komponenteInfo.komponente.id, updated);
          
          // Prüfe ob Checkliste jetzt vollständig ist und schließe Komponente ab
          const allChecked = updated.length > 0 && updated.every((i) => i.checked);
          if (allChecked && onKomponenteAktualisieren) {
            // Komponente-Checkliste ist vollständig - jetzt Komponente abschließen
            onKomponenteAktualisieren(komponenteInfo.komponente.id, "abgeschlossen", true);
          }
        };

        return (
          <div key={item.id} className="space-y-2">
            <div
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                item.checked
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggle(item.id)}
                className="mt-0.5"
              />
              <label
                className={cn(
                  "flex-1 cursor-pointer text-sm whitespace-pre-line",
                  item.checked ? "text-slate-700 dark:text-muted-foreground line-through" : "text-slate-900 dark:text-foreground"
                )}
                onClick={() => onToggle(item.id)}
                style={{ whiteSpace: 'pre-line' }}
              >
                {item.text}
              </label>
            </div>
            
            {/* Komponenten-Checkliste direkt unter dem Item, eingerückt */}
            {komponenteInfo && item.checked && (
              <div className="ml-8 pl-4 border-l-2 border-slate-300 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      komponenteAllChecked
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    )}
                  >
                    {komponenteInfo.komponente.name}: {komponenteCheckedCount} / {komponenteCheckliste!.length} erfüllt
                  </Badge>
                </div>
                <div className="space-y-2">
                  {komponenteCheckliste!.map((komponenteItem) => (
                    <div
                      key={komponenteItem.id}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg border transition-colors",
                        komponenteItem.checked
                          ? "bg-green-50 border-green-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <Checkbox
                        checked={komponenteItem.checked}
                        onCheckedChange={() => handleKomponenteToggle(komponenteItem.id)}
                        className="mt-0.5"
                      />
                      <label
                        className={cn(
                          "flex-1 cursor-pointer text-xs whitespace-pre-line",
                          komponenteItem.checked ? "text-slate-700 dark:text-muted-foreground line-through" : "text-slate-900 dark:text-foreground"
                        )}
                        onClick={() => handleKomponenteToggle(komponenteItem.id)}
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {komponenteItem.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );


  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{titel}</span>
          <Badge
            className={cn(
              "text-sm",
              allesVollstaendig
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            )}
          >
            {allesVollstaendig ? "✓ Vollständig" : `${checkedCount} / ${verfuegbareCheckliste.length} erfüllt`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Badge
              className={cn(
                "text-sm",
                allChecked
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
              )}
            >
              {checkedCount} / {verfuegbareCheckliste.length} erfüllt
            </Badge>
          </div>
          {renderCheckliste(verfuegbareCheckliste, handleToggle)}
        </div>
        
        {hatKomponentenChecklisten && !alleKomponentenChecklistenVollstaendig && (
          <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠ Bitte arbeiten Sie auch die Komponenten-Checklisten unter den abgehakten Punkten ab.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

