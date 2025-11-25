"use client";

import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import type { AbnahmeChecklisteItem } from "@/types";
import { cn } from "@/lib/utils";

// Hilfsfunktion zum Rendern von Text mit Zeilenumbrüchen
// Behandelt sowohl \n (Unix) als auch \r\n (Windows) Zeilenumbrüche
const renderTextWithLineBreaks = (text: string) => {
  if (!text) return null;
  // Normalisiere alle Zeilenumbrüche zu \n
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');
  
  // Wenn nur eine Zeile, einfach zurückgeben
  if (lines.length === 1) {
    return <>{text}</>;
  }
  
  // Mehrere Zeilen: rendere mit <br />
  return (
    <>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
};

interface AbnahmeChecklisteProps {
  checkliste: AbnahmeChecklisteItem[];
  onChecklisteChange: (checkliste: AbnahmeChecklisteItem[]) => void;
  onAbnahmeAbschließen: (status: "bestanden" | "verweigert") => void;
  titel?: string; // Optionaler Titel für die Checkliste
}

// Standard-Checkliste für technische Abnahme
export const STANDARD_ABNAHME_CHECKLISTE: Omit<AbnahmeChecklisteItem, "checked">[] = [
  { id: "1", text: "Alle Komponenten korrekt montiert und befestigt" },
  { id: "2", text: "Verdrahtung nach Schaltplan korrekt ausgeführt" },
  { id: "3", text: "Erdungen fachgerecht hergestellt" },
  { id: "4", text: "Sicherheitsabstände eingehalten" },
  { id: "5", text: "Beschriftungen vollständig und korrekt" },
  { id: "6", text: "Funktionstest erfolgreich durchgeführt" },
  { id: "7", text: "Isolationswiderstand gemessen und dokumentiert" },
  { id: "8", text: "Schutzleiterwiderstand gemessen und dokumentiert" },
  { id: "9", text: "Dokumentation vollständig (Schaltplan, Stückliste, Prüfprotokoll)" },
  { id: "10", text: "Schaltschrank sauber und frei von Fremdkörpern" },
  { id: "11", text: "Türen und Klappen funktionieren einwandfrei" },
  { id: "12", text: "Klimatisierung (Heizung/Lüftung) funktionsfähig" },
];

// Checkliste für Endabnahme
export const ENDABNAHME_CHECKLISTE: Omit<AbnahmeChecklisteItem, "checked">[] = [
  { id: "gl-1", text: "Technische Abnahme erfolgreich abgeschlossen" },
  { id: "gl-2", text: "Alle Dokumentationen vollständig und geprüft" },
  { id: "gl-3", text: "Schaltplan entspricht den Anforderungen" },
  { id: "gl-4", text: "Qualitätsstandards eingehalten" },
  { id: "gl-5", text: "Terminplan eingehalten" },
  { id: "gl-6", text: "Kostenrahmen eingehalten" },
  { id: "gl-7", text: "Kundenspezifische Anforderungen erfüllt" },
  { id: "gl-8", text: "Rechnungsstellung vorbereitet" },
  { id: "gl-9", text: "Auslieferung vorbereitet und terminiert" },
  { id: "gl-10", text: "Kundenschulung geplant (falls erforderlich)" },
];

export function AbnahmeCheckliste({
  checkliste,
  onChecklisteChange,
  onAbnahmeAbschließen,
  titel = "Technische Abnahme - Checkliste",
}: AbnahmeChecklisteProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleToggle = (itemId: string) => {
    const updated = checkliste.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onChecklisteChange(updated);
  };

  const handleImageUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const updated = checkliste.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              bilder: [...(item.bilder || []), imageUrl],
            };
          }
          return item;
        });
        onChecklisteChange(updated);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRefs.current[itemId]) {
      fileInputRefs.current[itemId]!.value = "";
    }
  };

  const handleRemoveImage = (itemId: string, imageIndex: number) => {
    const updated = checkliste.map((item) => {
      if (item.id === itemId && item.bilder) {
        return {
          ...item,
          bilder: item.bilder.filter((_, index) => index !== imageIndex),
        };
      }
      return item;
    });
    onChecklisteChange(updated);
  };

  const allChecked = checkliste.every((item) => item.checked);
  const hasUnchecked = checkliste.some((item) => !item.checked);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{titel}</span>
          <Badge
            className={cn(
              "text-sm",
              allChecked
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            )}
          >
            {checkliste.filter((item) => item.checked).length} / {checkliste.length} erfüllt
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checkliste */}
        <div className="space-y-3">
          {checkliste.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                item.checked
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <label
                    className={cn(
                      "cursor-pointer text-sm block whitespace-pre-line",
                      item.checked ? "text-slate-700 line-through" : "text-slate-900"
                    )}
                    onClick={() => handleToggle(item.id)}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {item.text}
                  </label>
                  
                  {/* Bild-Upload Bereich */}
                  <div className="mt-2 space-y-2">
                    {/* Upload Button */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={(el) => {
                          fileInputRefs.current[item.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(item.id, e)}
                        className="hidden"
                        id={`image-upload-${item.id}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        className="h-7 text-xs gap-1.5"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Bild hinzufügen
                      </Button>
                      {item.bilder && item.bilder.length > 0 && (
                        <span className="text-xs text-slate-500">
                          {item.bilder.length} Bild{item.bilder.length !== 1 ? "er" : ""}
                        </span>
                      )}
                    </div>
                    
                    {/* Bild-Galerie */}
                    {item.bilder && item.bilder.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {item.bilder.map((bildUrl, bildIndex) => (
                          <div key={bildIndex} className="relative group">
                            <img
                              src={bildUrl}
                              alt={`Bild ${bildIndex + 1} für ${item.text}`}
                              className="w-full h-24 object-cover rounded border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(item.id, bildIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {/* Bild-Vorschau Modal (optional - könnte erweitert werden) */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status-Warnung */}
        {hasUnchecked && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">
                Abnahme kann nicht bestanden werden
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Alle Punkte müssen abgehakt sein, um die Abnahme zu bestehen. Nicht erfüllte Punkte
                erfordern Nacharbeit.
              </p>
            </div>
          </div>
        )}

        {allChecked && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Alle Prüfpunkte erfüllt
              </p>
              <p className="text-xs text-green-700 mt-1">
                Die technische Abnahme kann bestanden werden.
              </p>
            </div>
          </div>
        )}

        {/* Aktions-Buttons */}
        <div className="flex gap-3 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onAbnahmeAbschließen("verweigert")}
            className="flex-1"
            disabled={allChecked}
          >
            Abnahme verweigern
          </Button>
          <Button
            onClick={() => onAbnahmeAbschließen("bestanden")}
            className="flex-1"
            disabled={!allChecked}
          >
            Abnahme bestanden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

