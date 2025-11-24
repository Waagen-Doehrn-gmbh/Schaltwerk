"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { AbnahmeChecklisteItem, Komponente, Checkliste } from "@/types";
import { cn } from "@/lib/utils";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import { filterDeletedFallbackChecklisten } from "@/lib/checklisten-fallback";

interface KomponentenChecklisteInlineProps {
  komponente: Komponente;
  onComplete: () => void; // Wird aufgerufen wenn Checkliste vollständig abgearbeitet wurde
}

// Fallback: Komponenten-spezifische Checklisten (in einer echten App würde dies aus der DB kommen)
const getKomponentenChecklisten = (): Checkliste[] => {
  return [
    {
      id: "checkliste-zeitschaltuhr",
      name: "Zeitschaltuhr - Hinweise",
      typ: "komponenten",
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

export function KomponentenChecklisteInline({
  komponente,
  onComplete,
}: KomponentenChecklisteInlineProps) {
  const checklistenContext = useChecklistenOptional();
  const contextChecklisten = checklistenContext?.checklisten || [];
  
  // Memoize die Checklisten-Arrays um Referenz-Stabilität zu gewährleisten
  const contextChecklistenIds = useMemo(
    () => JSON.stringify(contextChecklisten.map(c => c.id).sort()),
    [contextChecklisten]
  );
  
  const komponentenChecklisten = useMemo(() => {
    const all = getKomponentenChecklisten();
    return filterDeletedFallbackChecklisten(all);
  }, []);
  
  // Memoize allAvailableChecklisten nur wenn sich die IDs ändern
  const allAvailableChecklisten = useMemo(
    () => [...contextChecklisten, ...komponentenChecklisten],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextChecklistenIds, komponentenChecklisten]
  );

  // Finde die Checkliste für diese Komponente - memoize basierend auf ID
  const checklisteTemplate = useMemo(
    () => allAvailableChecklisten.find((c) => c.id === komponente.checklisteId),
    [allAvailableChecklisten, komponente.checklisteId]
  );

  const [checkliste, setCheckliste] = useState<AbnahmeChecklisteItem[]>([]);
  
  // Speichere die Komponenten-ID und Checkliste-ID um zu verhindern, dass die Checkliste mehrfach initialisiert wird
  const initializedForRef = useRef<{ komponenteId: string; checklisteId?: string } | undefined>(undefined);

  // Initialisiere Checkliste beim Mount oder wenn sich die Komponenten-ID oder Checkliste-ID ändert
  useEffect(() => {
    const komponenteChanged = initializedForRef.current?.komponenteId !== komponente.id;
    const checklisteIdChanged = initializedForRef.current?.checklisteId !== komponente.checklisteId;
    
    if (komponenteChanged || checklisteIdChanged || checkliste.length === 0) {
      // Finde die Checkliste direkt hier, um stale closure zu vermeiden
      const komponentenChecklisten = getKomponentenChecklisten();
      const allChecklisten = [...contextChecklisten, ...komponentenChecklisten];
      const template = allChecklisten.find((c) => c.id === komponente.checklisteId);
      
      if (template) {
        const initialCheckliste = template.items.map((item) => ({
          ...item,
          checked: false,
        }));
        setCheckliste(initialCheckliste);
        initializedForRef.current = {
          komponenteId: komponente.id,
          checklisteId: komponente.checklisteId,
        };
      } else {
        // Keine Checkliste gefunden - State zurücksetzen
        setCheckliste([]);
        initializedForRef.current = {
          komponenteId: komponente.id,
          checklisteId: komponente.checklisteId,
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [komponente.id, komponente.checklisteId]); // Komponenten-ID UND Checkliste-ID

  const handleToggle = (itemId: string) => {
    setCheckliste((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = checkliste.length > 0 && checkliste.every((item) => item.checked);
  const checkedCount = checkliste.filter((item) => item.checked).length;

  // Automatisch abschließen wenn alle Items gecheckt sind
  useEffect(() => {
    if (allChecked && checkliste.length > 0) {
      // Kurze Verzögerung damit der Benutzer sieht, dass alles abgehakt ist
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [allChecked, checkliste.length, onComplete]);

  if (!checklisteTemplate) {
    // Keine Checkliste für diese Komponente
    return null;
  }

  return (
    <div className="mt-3 p-4 bg-slate-50 dark:bg-muted rounded-lg border border-slate-200 dark:border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-foreground mb-1">
              {checklisteTemplate.name}
            </h4>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">
              Bitte arbeiten Sie die folgenden Punkte ab, bevor Sie die Komponente als abgeschlossen markieren.
            </p>
          </div>
          <Badge
            className={cn(
              "text-sm",
              allChecked
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            )}
          >
            {checkedCount} / {checkliste.length} erfüllt
          </Badge>
        </div>

        <div className="space-y-2">
          {checkliste.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                item.checked
                  ? "bg-green-50 border-green-200"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-border"
              )}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => handleToggle(item.id)}
                className="mt-0.5"
              />
              <label
                className={cn(
                  "flex-1 cursor-pointer text-sm",
                  item.checked ? "text-slate-600 dark:text-slate-400 line-through" : "text-slate-900 dark:text-foreground"
                )}
                onClick={() => handleToggle(item.id)}
              >
                {item.text}
              </label>
            </div>
          ))}
        </div>

        {!allChecked && (
          <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠ Bitte erfüllen Sie alle Punkte, bevor Sie die Komponente abschließen können.
            </p>
          </div>
        )}

        {allChecked && (
          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              ✓ Alle Punkte erfüllt! Die Komponente wird automatisch als abgeschlossen markiert.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

