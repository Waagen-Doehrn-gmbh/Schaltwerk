"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { AbnahmeChecklisteItem, Komponente, Checkliste } from "@/types";
import { cn } from "@/lib/utils";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import { filterDeletedFallbackChecklisten } from "@/lib/checklisten-fallback";

interface AufgabenChecklisteProps {
  checkliste: AbnahmeChecklisteItem[];
  onChecklisteChange: (checkliste: AbnahmeChecklisteItem[]) => void;
  titel?: string;
  komponenten?: Komponente[]; // Verfügbare Komponenten
  onKomponenteAktualisieren?: (komponenteId: string, status: "abgeschlossen", viaCheckliste: boolean) => void;
  getKomponentenChecklistenStatus?: React.MutableRefObject<(() => { vollstaendig: boolean; unvollstaendige: string[] }) | null>;
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
}: AufgabenChecklisteProps) {
  const checklistenContext = useChecklistenOptional();
  const allChecklisten = checklistenContext?.checklisten || [];
  const komponentenChecklisten = useMemo(() => {
    const all = getKomponentenChecklisten();
    return filterDeletedFallbackChecklisten(all);
  }, []);
  const allAvailableChecklisten = useMemo(
    () => [...allChecklisten, ...komponentenChecklisten],
    [allChecklisten, komponentenChecklisten]
  );

  // Filtere Checkliste: Nur Punkte anzeigen, deren Komponenten existieren
  // WICHTIG: Zeige Items auch an, wenn die Komponente bereits abgeschlossen ist
  // (nur wenn sie nicht mehr in der Liste existieren, werden sie ausgeblendet)
  const verfuegbareCheckliste = checkliste.filter((item) => {
    if (!item.komponenteId && !item.artikelNummer) {
      return true; // Punkt ohne Komponenten-Verknüpfung immer anzeigen
    }
    
    // Prüfe ob Komponente existiert (unabhängig vom Status)
    if (item.komponenteId) {
      return komponenten.some((k) => k.id === item.komponenteId);
    }
    
    if (item.artikelNummer) {
      return komponenten.some((k) => k.artikelNummer === item.artikelNummer);
    }
    
    return false;
  });

  // Finde Komponenten mit eigenen Checklisten, die in der Aufgaben-Checkliste abgehakt wurden
  const komponentenMitChecklisten = useMemo(() => {
    const result: Array<{ komponente: Komponente; checklisteTemplate: Checkliste }> = [];
    
    verfuegbareCheckliste.forEach((item) => {
      if (item.checked) {
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
            // Prüfe ob bereits hinzugefügt
            if (!result.some((r) => r.komponente.id === komponente.id)) {
              result.push({ komponente, checklisteTemplate });
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
            (item) => 
              (item.komponenteId === id || 
               (item.artikelNummer && komponenten.find(k => k.id === id)?.artikelNummer === item.artikelNummer)) &&
              item.checked
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
    
    // Wenn abgehakt wird (von false zu true) UND Komponente verknüpft ist
    // ABER: Nur wenn die Komponente keine eigene Checkliste hat ODER die Checkliste bereits vollständig ist
    if (!wasChecked && onKomponenteAktualisieren) {
      let komponente: Komponente | undefined;
      
      if (item.komponenteId) {
        komponente = komponenten.find((k) => k.id === item.komponenteId);
      } else if (item.artikelNummer) {
        komponente = komponenten.find((k) => k.artikelNummer === item.artikelNummer);
      }
      
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
  };

  const allChecked = verfuegbareCheckliste.every((item) => item.checked);
  const checkedCount = verfuegbareCheckliste.filter((item) => item.checked).length;
  const hatKomponentenChecklisten = komponentenMitChecklisten.length > 0;
  const allesVollstaendig = allChecked && (hatKomponentenChecklisten ? alleKomponentenChecklistenVollstaendig : true);

  // Finde Komponente für ein Checklisten-Item
  const findKomponenteFuerItem = (item: AbnahmeChecklisteItem): { komponente: Komponente; checklisteTemplate: Checkliste } | null => {
    if (!item.checked) return null;
    
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
                  "flex-1 cursor-pointer text-sm",
                  item.checked ? "text-slate-700 dark:text-muted-foreground line-through" : "text-slate-900 dark:text-foreground"
                )}
                onClick={() => onToggle(item.id)}
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
                          "flex-1 cursor-pointer text-xs",
                          komponenteItem.checked ? "text-slate-700 dark:text-muted-foreground line-through" : "text-slate-900 dark:text-foreground"
                        )}
                        onClick={() => handleKomponenteToggle(komponenteItem.id)}
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

