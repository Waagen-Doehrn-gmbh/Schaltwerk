"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { aufgabeApi } from "@/lib/api";
import { 
  AbnahmeCheckliste, 
  STANDARD_ABNAHME_CHECKLISTE,
  ENDABNAHME_CHECKLISTE 
} from "./AbnahmeCheckliste";
import { AufgabenCheckliste } from "./AufgabenCheckliste";
import type { ProtokollFormData, AbnahmeChecklisteItem, User, Arbeitsprotokoll, Checkliste, Komponente, Aufgabe } from "@/types";
import { AlertCircle } from "lucide-react";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import { filterDeletedFallbackChecklisten } from "@/lib/checklisten-fallback";

const protokollSchema = z.object({
  aufgabe: z.string().min(1, "Aufgabe ist erforderlich"),
  details: z.string().optional(),
  zeitaufwand: z.number().min(0.5, "Zeitaufwand muss mindestens 0.5 Stunden sein"),
  abnahmeStatus: z.enum(["bestanden", "verweigert"]).optional(),
  abnahmeCheckliste: z.array(z.any()).optional(),
  abnahmeTyp: z.enum(["technisch", "endabnahme"]).optional(),
  checklisteStatus: z.enum(["abgeschlossen", "teilabschluss"]).optional(),
  abgeschlosseneKomponentenIds: z.array(z.string()).optional(),
});

type ProtokollFormValues = z.infer<typeof protokollSchema>;

// Fallback: Checklisten wenn Context nicht verfügbar ist
const getFallbackChecklisten = (): Checkliste[] => {
  return [
    {
      id: "checkliste-1",
      name: "Standard Technische Abnahme",
      typ: "allgemein",
      items: STANDARD_ABNAHME_CHECKLISTE,
    },
    {
      id: "checkliste-2",
      name: "Standard Endabnahme",
      typ: "allgemein",
      items: ENDABNAHME_CHECKLISTE,
    },
    {
      id: "checkliste-grundplatte",
      name: "Grundplatte Bestückt und Verdrahtet",
      typ: "allgemein",
      items: [
        {
          id: "gp-1",
          text: "Hauptschalter 63A montiert und verdrahtet",
          artikelNummer: "HS-63A-001",
        },
        {
          id: "gp-2",
          text: "Sicherungsautomaten 16A montiert und verdrahtet",
          artikelNummer: "LS-16A-005",
        },
        {
          id: "gp-3",
          text: "Zeitschaltuhr montiert und verdrahtet",
          artikelNummer: "ZT-001",
        },
        {
          id: "gp-4",
          text: "Schaltrelais 24V montiert und verdrahtet",
          artikelNummer: "SR-24V-001",
        },
        {
          id: "gp-5",
          text: "Klemmenleisten montiert und verdrahtet",
        },
        {
          id: "gp-6",
          text: "Beschriftungen angebracht",
        },
      ],
    },
  ];
};

interface ProtokollFormProps {
  projektId: string;
  onSubmit?: (data: ProtokollFormData) => void;
  currentUser?: User;
  protokolle?: Arbeitsprotokoll[];
  komponenten?: Komponente[]; // Verfügbare Komponenten
  onKomponenteAktualisieren?: (komponenteId: string, status: "abgeschlossen", viaCheckliste: boolean) => void;
}

export function ProtokollForm({ 
  projektId, 
  onSubmit, 
  currentUser, 
  protokolle = [],
  komponenten = [],
  onKomponenteAktualisieren,
}: ProtokollFormProps) {
  const user = currentUser;
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [aufgabenLoading, setAufgabenLoading] = useState(true);
  const [aufgabenError, setAufgabenError] = useState<string | null>(null);
  const checklistenContext = useChecklistenOptional();
  const fallbackChecklisten = useMemo(() => {
    const allFallbacks = getFallbackChecklisten();
    // Filtere gelöschte Fallback-Checklisten
    return filterDeletedFallbackChecklisten(allFallbacks);
  }, []);
  
  // Lade Aufgaben aus der API
  useEffect(() => {
    const loadAufgaben = async () => {
      try {
        setAufgabenLoading(true);
        setAufgabenError(null);
        const aufgabenData = await aufgabeApi.getAll();
        setAufgaben(aufgabenData);
      } catch (err: any) {
        setAufgabenError(err.message || "Fehler beim Laden der Aufgaben");
        console.error("Fehler beim Laden der Aufgaben:", err);
      } finally {
        setAufgabenLoading(false);
      }
    };
    loadAufgaben();
  }, []);

  // Helper: Finde Aufgabe nach Name
  const getAufgabeByName = (name: string): Aufgabe | undefined => {
    return aufgaben.find((a) => a.name === name);
  };

  const checklisten = useMemo(() => {
    // Kombiniere Context-Checklisten mit Fallback-Checklisten
    // Entferne Duplikate (gleiche ID)
    const contextChecklisten = checklistenContext?.checklisten || [];
    const allChecklisten = [...contextChecklisten];
    
    // Füge Fallback-Checklisten hinzu, die nicht im Context sind
    fallbackChecklisten.forEach((fallback) => {
      if (!allChecklisten.some((c) => c.id === fallback.id)) {
        allChecklisten.push(fallback);
      }
    });
    
    console.log("📋 Checklisten im ProtokollForm:", {
      contextChecklisten: contextChecklisten.length,
      fallbackChecklisten: fallbackChecklisten.length,
      total: allChecklisten.length,
      isLoading: checklistenContext?.isLoading,
    });
    console.log("📋 Checklisten-Details:", allChecklisten.map(c => ({
      id: c.id,
      idType: typeof c.id,
      name: c.name,
      itemsCount: c.items.length
    })));
    
    return allChecklisten;
  }, [checklistenContext?.checklisten, fallbackChecklisten, checklistenContext?.isLoading]);
  
  // Hilfsfunktion: Prüft ob Benutzer eine bestimmte Rolle oder höhere hat
  const hatRolleOderHoeher = (userRolle: string | undefined, erforderlicheRolle: string | undefined): boolean => {
    if (!userRolle || !erforderlicheRolle) return true; // Wenn keine Rolle erforderlich, hat jeder Zugriff
    
    // Admin hat immer alle Berechtigungen
    if (userRolle === "admin") return true;
    
    // Gleiche Rolle hat Zugriff
    if (userRolle === erforderlicheRolle) return true;
    
    // Hierarchie: admin > analyse > endabnahme > technische_abnahme > monteur
    const rollenHierarchie: Record<string, number> = {
      monteur: 1,
      technische_abnahme: 2,
      endabnahme: 3,
      analyse: 4,
      admin: 5,
    };
    
    const userLevel = rollenHierarchie[userRolle] || 0;
    const erforderlichLevel = rollenHierarchie[erforderlicheRolle] || 0;
    
    return userLevel >= erforderlichLevel;
  };

  // Rückwärtskompatibilität: Alte Berechtigungsprüfungen
  const kannTechnischeAbnahme = 
    user?.rolle === "admin" || 
    user?.rolle === "technische_abnahme" || 
    user?.rolle === "endabnahme" ||
    user?.berechtigungen?.includes("abnahme");
  
  const kannEndabnahme = 
    user?.rolle === "admin" || 
    user?.rolle === "endabnahme" ||
    user?.berechtigungen?.includes("endabnahme");

  const technischeAbnahmeBestanden = protokolle.some(
    (protokoll) =>
      protokoll.projektId === projektId &&
      protokoll.aufgabe === "Technische Abnahme" &&
      protokoll.abnahmeStatus === "bestanden" &&
      protokoll.abnahmeTyp === "technisch"
  );

  const form = useForm<ProtokollFormValues>({
    resolver: zodResolver(protokollSchema),
    defaultValues: {
      aufgabe: "",
      details: "",
      zeitaufwand: 0.5,
    },
  });

  const watchedAufgabe = form.watch("aufgabe");
  const watchedDetails = form.watch("details");
  const watchedZeitaufwand = form.watch("zeitaufwand");
  const watchedChecklisteStatus = form.watch("checklisteStatus");
  const watchedAbnahmeStatus = form.watch("abnahmeStatus");

  const [komponentenChecklistenFehler, setKomponentenChecklistenFehler] = useState<string>("");
  const [showCheckliste, setShowCheckliste] = useState(false);
  const [checkliste, setCheckliste] = useState<AbnahmeChecklisteItem[]>([]);
  const [checklisteTitel, setChecklisteTitel] = useState<string>("");
  const [isAbnahmeAufgabe, setIsAbnahmeAufgabe] = useState(false);
  // Ref zum Abrufen des Status der Komponenten-Checklisten (wird nur beim Submit geprüft)
  const komponentenChecklistenStatusRef = useRef<(() => { vollstaendig: boolean; unvollstaendige: string[] }) | null>(null);

  // Aktualisiere Checkliste-Status automatisch wenn sich Checkliste ändert
  useEffect(() => {
    if (showCheckliste && checkliste.length > 0 && !isAbnahmeAufgabe) {
      const allChecked = checkliste.every((item) => item.checked);
      const status: "abgeschlossen" | "teilabschluss" = allChecked ? "abgeschlossen" : "teilabschluss";
      form.setValue("checklisteStatus", status, { shouldValidate: false });
    } else if (!showCheckliste || isAbnahmeAufgabe) {
      form.setValue("checklisteStatus", undefined, { shouldValidate: false });
    }
  }, [checkliste, showCheckliste, isAbnahmeAufgabe, form]);

  // Initialisiere Checkliste wenn Aufgabe ausgewählt wird
  useEffect(() => {
    if (!watchedAufgabe) {
      setShowCheckliste(false);
      setCheckliste([]);
      setIsAbnahmeAufgabe(false);
      return;
    }

    // Warte bis Checklisten geladen sind
    if (checklistenContext?.isLoading) {
      console.log("⏳ Warte auf Checklisten...");
      return;
    }

    const aufgabe = getAufgabeByName(watchedAufgabe);
    if (!aufgabe) {
      console.log("❌ Aufgabe nicht gefunden:", watchedAufgabe);
      setShowCheckliste(false);
      setCheckliste([]);
      setIsAbnahmeAufgabe(false);
      return;
    }

    console.log("✅ Aufgabe gefunden:", {
      name: aufgabe.name,
      checklisteId: aufgabe.checklisteId,
      verfügbareChecklisten: checklisten.length,
    });

    // Dynamische Berechtigungsprüfung: Prüfe erforderliche Rolle aus der Aufgabe
    if (aufgabe.erforderlicheRolle) {
      if (!hatRolleOderHoeher(user?.rolle, aufgabe.erforderlicheRolle)) {
        form.setValue("aufgabe", "");
        const rolleLabels: Record<string, string> = {
          admin: "Administrator",
          analyse: "Analyse",
          endabnahme: "Endabnahme",
          technische_abnahme: "Technische Abnahme",
          monteur: "Monteur",
        };
        form.setError("aufgabe", { 
          message: `Diese Aufgabe erfordert mindestens die Rolle "${rolleLabels[aufgabe.erforderlicheRolle] || aufgabe.erforderlicheRolle}"` 
        });
        return;
      }
    }

    // Prüfe ob es eine Abnahme-Aufgabe ist (für Rückwärtskompatibilität)
    const istAbnahme = watchedAufgabe === "Technische Abnahme" || watchedAufgabe === "Endabnahme";
    setIsAbnahmeAufgabe(istAbnahme);

    if (istAbnahme) {
      // Abnahme-Aufgaben: Spezielle Behandlung (Rückwärtskompatibilität)
      if (watchedAufgabe === "Technische Abnahme") {
        if (!kannTechnischeAbnahme) {
          form.setValue("aufgabe", "");
          form.setError("aufgabe", { message: "Sie haben keine Berechtigung für Technische Abnahme" });
          return;
        }
        
        if (checkliste.length === 0) {
          const initialCheckliste = STANDARD_ABNAHME_CHECKLISTE.map((item) => ({
            ...item,
            checked: false,
          }));
          setCheckliste(initialCheckliste);
        }
        setChecklisteTitel("Technische Abnahme - Checkliste");
        setShowCheckliste(true);
        form.setValue("abnahmeTyp", "technisch", { shouldValidate: false });
      } else if (watchedAufgabe === "Endabnahme") {
        if (!kannEndabnahme) {
          form.setValue("aufgabe", "");
          form.setError("aufgabe", { message: "Sie haben keine Berechtigung für Endabnahme" });
          return;
        }
        if (!technischeAbnahmeBestanden) {
          form.setValue("aufgabe", "");
          form.setError("aufgabe", { 
            message: "Endabnahme ist erst nach erfolgreicher Technischer Abnahme möglich" 
          });
          return;
        }
        
        if (checkliste.length === 0) {
          const initialCheckliste = ENDABNAHME_CHECKLISTE.map((item) => ({
            ...item,
            checked: false,
          }));
          setCheckliste(initialCheckliste);
        }
        setChecklisteTitel("Endabnahme - Checkliste");
        setShowCheckliste(true);
        form.setValue("abnahmeTyp", "endabnahme", { shouldValidate: false });
      }
    } else {
      // Normale Aufgaben: Prüfe ob Checkliste zugeordnet ist
      if (aufgabe.checklisteId) {
        console.log("🔍 Suche Checkliste:", {
          aufgabeName: aufgabe.name,
          checklisteId: aufgabe.checklisteId,
          checklisteIdType: typeof aufgabe.checklisteId,
          checklistenAnzahl: checklisten.length,
        });
        console.log("📋 ALLE CHECKLISTEN:", JSON.stringify(checklisten.map(c => ({ id: c.id, name: c.name })), null, 2));
        console.log("📋 Gesuchte ID:", aufgabe.checklisteId);
        console.log("📋 Verfügbare Checklisten-IDs (DETAILS):");
        checklisten.forEach((c, index) => {
          const strictMatch = c.id === aufgabe.checklisteId;
          const looseMatch = String(c.id).trim() === String(aufgabe.checklisteId).trim();
          console.log(`   [${index}] ID: "${c.id}" | Name: "${c.name}" | Match: ${strictMatch || looseMatch ? '✅' : '❌'}`);
          if (!strictMatch && !looseMatch) {
            console.log(`      ⚠️ Kein Match: "${c.id}" !== "${aufgabe.checklisteId}"`);
            console.log(`      Typen: ${typeof c.id} vs ${typeof aufgabe.checklisteId}`);
            console.log(`      Längen: ${c.id?.length || 'undefined'} vs ${aufgabe.checklisteId?.length || 'undefined'}`);
          }
        });
        const zugeordneteCheckliste = checklisten.find((c) => {
          // Prüfe sowohl strikte als auch lose Übereinstimmung
          const strictMatch = c.id === aufgabe.checklisteId;
          const looseMatch = String(c.id).trim() === String(aufgabe.checklisteId).trim();
          const match = strictMatch || looseMatch;
          if (!match) {
            console.log(`  ⚠️ ID-Vergleich: "${c.id}" (${typeof c.id}) !== "${aufgabe.checklisteId}" (${typeof aufgabe.checklisteId})`);
          } else {
            console.log(`  ✅ ID-Übereinstimmung gefunden: "${c.id}" === "${aufgabe.checklisteId}"`);
          }
          return match;
        });
        console.log("✅ Gefundene Checkliste:", zugeordneteCheckliste ? {
          id: zugeordneteCheckliste.id,
          name: zugeordneteCheckliste.name,
          items: zugeordneteCheckliste.items.length
        } : "NICHT GEFUNDEN");
        if (zugeordneteCheckliste) {
          // Prüfe ob es bereits Protokolle mit dieser Aufgabe gibt
          const vorherigeProtokolle = protokolle.filter(
            (p) => p.projektId === projektId && p.aufgabe === watchedAufgabe && p.abnahmeCheckliste
          );
          
          // Sammle alle bereits abgehakten Punkte und Bilder aus vorherigen Protokollen
          const bereitsAbgehakt = new Set<string>();
          const punktDaten = new Map<string, { checked: boolean; bilder?: string[] }>();
          
          vorherigeProtokolle.forEach((protokoll) => {
            if (protokoll.abnahmeCheckliste) {
              protokoll.abnahmeCheckliste.forEach((item) => {
                if (item.checked) {
                  bereitsAbgehakt.add(item.id);
                }
                // Sammle auch Bilder und Status für jeden Punkt
                if (!punktDaten.has(item.id)) {
                  punktDaten.set(item.id, {
                    checked: item.checked,
                    bilder: item.bilder ? [...item.bilder] : undefined,
                  });
                } else {
                  // Wenn Punkt bereits existiert, füge Bilder hinzu (falls vorhanden)
                  const existing = punktDaten.get(item.id)!;
                  if (item.bilder && item.bilder.length > 0) {
                    existing.bilder = [...(existing.bilder || []), ...item.bilder];
                  }
                }
              });
            }
          });
          
          // Initialisiere Checkliste nur wenn sie noch nicht existiert oder leer ist
          // Das verhindert, dass die Checkliste zurückgesetzt wird, wenn sich die Komponenten ändern
          if (checkliste.length === 0) {
            const initialCheckliste = zugeordneteCheckliste.items.map((item) => {
              const punktInfo = punktDaten.get(item.id);
              return {
                ...item,
                checked: punktInfo?.checked || bereitsAbgehakt.has(item.id),
                bilder: punktInfo?.bilder,
              };
            });
            setCheckliste(initialCheckliste);
            console.log("✅ Checkliste initialisiert:", initialCheckliste.length, "Items");
          }
          setChecklisteTitel(`${aufgabe.name} - Checkliste`);
          setShowCheckliste(true);
        } else {
          console.log("❌ Checkliste nicht gefunden für ID:", aufgabe.checklisteId);
          setShowCheckliste(false);
          setCheckliste([]);
        }
      } else {
        console.log("❌ Aufgabe hat keine checklisteId:", aufgabe.name);
        setShowCheckliste(false);
        setCheckliste([]);
      }
      
      // Reset Abnahme-Status wenn normale Aufgabe ausgewählt wird
      if (form.getValues("abnahmeStatus") || form.getValues("abnahmeTyp")) {
        form.setValue("abnahmeStatus", undefined, { shouldValidate: false });
        form.setValue("abnahmeTyp", undefined, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAufgabe, kannTechnischeAbnahme, kannEndabnahme, protokolle, projektId, checklisten, checklistenContext?.isLoading, form]);

  const handleFormSubmit = async (data: ProtokollFormValues) => {
    // Bei Abnahme-Aufgaben: Prüfe ob Checkliste abgeschlossen wurde
    if (isAbnahmeAufgabe && !data.abnahmeStatus) {
      form.setError("aufgabe", { message: "Bitte schließen Sie die Abnahme ab" });
      return;
    }

    // Prüfe ob alle Komponenten-Checklisten vollständig sind (nur wenn Checkliste angezeigt wird)
    let komponentenChecklistenFehlerText = "";
    if (showCheckliste && !isAbnahmeAufgabe && komponentenChecklistenStatusRef.current) {
      const status = komponentenChecklistenStatusRef.current();
      if (!status.vollstaendig && status.unvollstaendige.length > 0) {
        komponentenChecklistenFehlerText = `Das Protokoll kann nicht erstellt werden, da die Checklisten für folgende Komponenten nicht vollständig abgearbeitet wurden: ${status.unvollstaendige.join(", ")}`;
        setKomponentenChecklistenFehler(komponentenChecklistenFehlerText);
      } else {
        setKomponentenChecklistenFehler("");
      }
    } else {
      setKomponentenChecklistenFehler("");
    }

    // Prüfe ob Komponenten-Checklisten-Fehler vorhanden ist
    if (komponentenChecklistenFehlerText) {
      form.setError("root", { message: komponentenChecklistenFehlerText });
      return;
    }

    // Prüfe Checkliste-Status für allgemeine Checklisten
    let checklisteStatus: "abgeschlossen" | "teilabschluss" | undefined = undefined;
    if (showCheckliste && checkliste.length > 0 && !isAbnahmeAufgabe) {
      const allChecked = checkliste.every((item) => item.checked);
      checklisteStatus = allChecked ? "abgeschlossen" : "teilabschluss";
    }

    // Submit mit Checkliste-Daten
    const submitData: ProtokollFormData = {
      aufgabe: data.aufgabe,
      details: data.details || "",
      zeitaufwand: data.zeitaufwand,
      abnahmeStatus: data.abnahmeStatus,
      abnahmeCheckliste: showCheckliste && checkliste.length > 0 ? checkliste : undefined,
      abnahmeTyp: data.abnahmeTyp,
      checklisteStatus,
      abgeschlosseneKomponentenIds: data.abgeschlosseneKomponentenIds,
    };

    console.log("Protokoll erstellt:", { ...submitData, projektId });
    if (onSubmit) {
      onSubmit(submitData);
    }

    // Reset
    form.reset({
      aufgabe: "",
      details: "",
      zeitaufwand: 0.5,
    });
    setCheckliste([]);
    setShowCheckliste(false);
    setIsAbnahmeAufgabe(false);
    setKomponentenChecklistenFehler("");
    komponentenChecklistenStatusRef.current = null;
    
    let statusText = "Protokoll erstellt!";
    if (submitData.abnahmeStatus === "bestanden") {
      statusText = "Abnahme bestanden!";
    } else if (submitData.abnahmeStatus === "verweigert") {
      statusText = "Abnahme verweigert - Nacharbeit erforderlich!";
    } else if (submitData.checklisteStatus === "teilabschluss") {
      statusText = "Protokoll erstellt (Teilabschluss) - Beim nächsten Mal werden bereits erledigte Punkte vorausgefüllt!";
    } else if (submitData.checklisteStatus === "abgeschlossen") {
      statusText = "Protokoll erstellt - Checkliste vollständig abgeschlossen!";
    }
    alert(statusText);
  };

  const handleAbnahmeAbschließen = (status: "bestanden" | "verweigert") => {
    const aufgabeName = watchedAufgabe === "Endabnahme" 
      ? "Endabnahme" 
      : "Technische Abnahme";
    
    const statusDetails = status === "bestanden"
      ? `${aufgabeName} bestanden. Alle ${checkliste.length} Prüfpunkte erfüllt.`
      : `${aufgabeName} verweigert. Nacharbeit erforderlich. Nicht erfüllte Punkte: ${checkliste.filter(item => !item.checked).length}`;
    
    form.setValue("abnahmeStatus", status, { shouldValidate: false });
    if (!watchedDetails) {
      form.setValue("details", statusDetails, { shouldValidate: false });
    }
  };

  const getVerfuegbareAufgaben = () => {
    return aufgaben.filter((aufgabe) => {
      // Dynamische Berechtigungsprüfung: Prüfe erforderliche Rolle
      if (aufgabe.erforderlicheRolle) {
        if (!hatRolleOderHoeher(user?.rolle, aufgabe.erforderlicheRolle)) {
          return false;
        }
      }
      
      // Rückwärtskompatibilität: Alte Abnahme-Logik
      if (aufgabe.name === "Technische Abnahme") {
        return kannTechnischeAbnahme;
      }
      if (aufgabe.name === "Endabnahme") {
        return kannEndabnahme && technischeAbnahmeBestanden;
      }
      return true;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Arbeitsprotokoll</CardTitle>
      </CardHeader>
      <CardContent>
        {aufgabenError && (
          <div className="mb-4 p-3 rounded-lg border bg-red-50 border-red-200">
            <p className="text-sm text-red-800">
              Fehler beim Laden der Aufgaben: {aufgabenError}
            </p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Aufgabe */}
            <FormField
              control={form.control}
              name="aufgabe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aufgabe *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={aufgabenLoading}
                    >
                      <SelectTrigger className={form.formState.errors.aufgabe ? "border-red-500" : ""}>
                        <SelectValue placeholder={aufgabenLoading ? "Lade Aufgaben..." : "Aufgabe auswählen"} />
                      </SelectTrigger>
                      <SelectContent>
                        {aufgabenLoading ? (
                          <SelectItem value="loading" disabled>Lade Aufgaben...</SelectItem>
                        ) : aufgaben.length === 0 ? (
                          <SelectItem value="no-tasks" disabled>Keine Aufgaben verfügbar</SelectItem>
                        ) : (
                          getVerfuegbareAufgaben().map((aufgabe) => (
                            <SelectItem key={aufgabe.id} value={aufgabe.name}>
                              {aufgabe.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {(!kannTechnischeAbnahme || !kannEndabnahme || !technischeAbnahmeBestanden) && (
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {!kannTechnischeAbnahme && !kannEndabnahme && (
                        <span>Sie haben keine Berechtigung für Abnahme-Aufgaben</span>
                      )}
                      {!kannTechnischeAbnahme && kannEndabnahme && (
                        <span>Technische Abnahme erfordert spezielle Berechtigung</span>
                      )}
                      {kannTechnischeAbnahme && !kannEndabnahme && (
                        <span>Endabnahme erfordert spezielle Berechtigung</span>
                      )}
                      {kannEndabnahme && !technischeAbnahmeBestanden && (
                        <span>Endabnahme ist erst nach erfolgreicher Technischer Abnahme möglich</span>
                      )}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

          {/* Checkliste */}
          {showCheckliste && (
            <div>
              {isAbnahmeAufgabe ? (
                <AbnahmeCheckliste
                  checkliste={checkliste}
                  onChecklisteChange={setCheckliste}
                  onAbnahmeAbschließen={handleAbnahmeAbschließen}
                  titel={checklisteTitel}
                />
               ) : (
                 <AufgabenCheckliste
                   checkliste={checkliste}
                   onChecklisteChange={setCheckliste}
                   titel={checklisteTitel}
                   komponenten={komponenten}
                   onKomponenteAktualisieren={onKomponenteAktualisieren}
                   getKomponentenChecklistenStatus={komponentenChecklistenStatusRef}
                 />
               )}
               {watchedChecklisteStatus && (
                 <div className="mt-3 p-3 rounded-lg border bg-slate-50 dark:bg-muted">
                   <p className="text-sm font-medium text-slate-700 dark:text-foreground">
                     Checkliste-Status:{" "}
                     <span
                       className={
                         watchedChecklisteStatus === "abgeschlossen"
                           ? "text-green-700 font-semibold"
                           : "text-yellow-700 font-semibold"
                       }
                     >
                       {watchedChecklisteStatus === "abgeschlossen"
                         ? "Abgeschlossen ✓"
                         : "Teilabschluss ⚠"}
                     </span>
                   </p>
                   {watchedChecklisteStatus === "teilabschluss" && (
                     <p className="text-xs text-yellow-700 mt-1">
                       Nicht alle Punkte sind abgehakt. Beim nächsten Mal werden die bereits erledigten Punkte vorausgefüllt.
                     </p>
                   )}
                 </div>
               )}
               {watchedAbnahmeStatus && (
                <div className="mt-3 p-3 rounded-lg border bg-slate-50 dark:bg-muted">
                  <p className="text-sm font-medium text-slate-700 dark:text-foreground">
                    Abnahme-Status:{" "}
                    <span
                      className={
                        watchedAbnahmeStatus === "bestanden"
                          ? "text-green-700 font-semibold"
                          : "text-red-700 font-semibold"
                      }
                    >
                      {watchedAbnahmeStatus === "bestanden"
                        ? "Bestanden ✓"
                        : "Verweigert ✗"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

            {/* Details */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Zusätzliche Informationen..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zeitaufwand */}
            <FormField
              control={form.control}
              name="zeitaufwand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zeitaufwand (Stunden) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={field.value}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                      }}
                      className={form.formState.errors.zeitaufwand ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Komponenten-Checklisten-Fehler */}
            {komponentenChecklistenFehler && (
              <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                <p className="text-sm text-red-800">{komponentenChecklistenFehler}</p>
              </div>
            )}

            {/* Root Error */}
            {form.formState.errors.root && (
              <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                <p className="text-sm text-red-800">{form.formState.errors.root.message}</p>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full">
              Protokoll erstellen
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
