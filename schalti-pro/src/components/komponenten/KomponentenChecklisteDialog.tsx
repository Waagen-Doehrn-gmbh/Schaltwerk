"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { AbnahmeChecklisteItem, Komponente, Checkliste } from "@/types";
import { cn } from "@/lib/utils";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import { filterDeletedFallbackChecklisten } from "@/lib/checklisten-fallback";

interface KomponentenChecklisteDialogProps {
  komponente: Komponente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void; // Wird aufgerufen wenn Checkliste vollständig abgearbeitet wurde
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

export function KomponentenChecklisteDialog({
  komponente,
  open,
  onOpenChange,
  onComplete,
}: KomponentenChecklisteDialogProps) {
  const checklistenContext = useChecklistenOptional();
  const contextChecklisten = checklistenContext?.checklisten || [];
  
  // Memoize die Checklisten-Arrays um Referenz-Stabilität zu gewährleisten
  // Verwende JSON.stringify für die IDs um zu prüfen ob sich der Inhalt geändert hat
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
  
  // Speichere die Template-ID um zu verhindern, dass die Checkliste mehrfach initialisiert wird
  const initializedForIdRef = useRef<string | undefined>(undefined);
  const wasOpenRef = useRef(false);

  // Initialisiere Checkliste nur wenn Dialog geöffnet wird
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    const justClosed = !open && wasOpenRef.current;
    const idChanged = initializedForIdRef.current !== komponente.checklisteId;
    
    wasOpenRef.current = open;
    
    if (justClosed) {
      // Reset beim Schließen
      setCheckliste([]);
      initializedForIdRef.current = undefined;
      return;
    }
    
    // Nur initialisieren wenn Dialog gerade geöffnet wurde ODER sich die Checkliste-ID geändert hat
    if (justOpened || (open && idChanged)) {
      // Finde die Checkliste direkt hier, um stale closure zu vermeiden
      // Kombiniere Context-Checklisten und Komponenten-Checklisten
      const komponentenChecklisten = getKomponentenChecklisten();
      const allChecklisten = [...contextChecklisten, ...komponentenChecklisten];
      const template = allChecklisten.find((c) => c.id === komponente.checklisteId);
      
      if (template) {
        const initialCheckliste = template.items.map((item) => ({
          ...item,
          checked: false,
        }));
        setCheckliste(initialCheckliste);
        initializedForIdRef.current = komponente.checklisteId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, komponente.checklisteId]); // Nur open und ID - contextChecklisten wird direkt verwendet

  const handleToggle = (itemId: string) => {
    setCheckliste((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = checkliste.length > 0 && checkliste.every((item) => item.checked);
  const checkedCount = checkliste.filter((item) => item.checked).length;

  const handleComplete = () => {
    if (allChecked) {
      onComplete();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset wird bereits im useEffect oben behandelt
  };

  if (!checklisteTemplate) {
    // Keine Checkliste für diese Komponente - sollte nicht passieren
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {komponente.name} - Hinweise
          </DialogTitle>
          <DialogDescription>
            Bitte arbeiten Sie die folgenden Punkte ab, bevor Sie die Komponente als abgeschlossen markieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between mb-2">
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

          <div className="space-y-3">
            {checkliste.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  item.checked
                    ? "bg-green-50 border-green-200"
                    : "bg-slate-50 border-slate-200"
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
                    item.checked ? "text-slate-700 line-through" : "text-slate-900"
                  )}
                  onClick={() => handleToggle(item.id)}
                >
                  {item.text}
                </label>
              </div>
            ))}
          </div>

          {!allChecked && (
            <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠ Bitte erfüllen Sie alle Punkte, bevor Sie die Komponente abschließen können.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleComplete} disabled={!allChecked}>
            Abgeschlossen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

