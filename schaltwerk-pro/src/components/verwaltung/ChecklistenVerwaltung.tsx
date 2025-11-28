"use client";

import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { useCreateCheckliste, useUpdateCheckliste, useDeleteCheckliste, useKomponenten } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useChecklisten as useChecklistenContext } from "@/components/verwaltung/ChecklistenContext";
import type { Checkliste } from "@/types";

const checklisteSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  typ: z.enum(["allgemein", "komponenten"]),
  items: z.array(z.object({
    id: z.string().optional(),
    text: z.string(),
    komponenteIds: z.array(z.string()).optional(),
  })).min(1, "Mindestens ein Item ist erforderlich"),
});

type ChecklisteFormData = z.infer<typeof checklisteSchema>;

export function ChecklistenVerwaltung() {
  const { checklisten, updateCheckliste, addCheckliste, deleteCheckliste: deleteFromContext, isLoading: contextLoading, refreshChecklisten } = useChecklistenContext();
  const { data: komponenten = [], isLoading: komponentenLoading } = useKomponenten();
  const createMutation = useCreateCheckliste();
  const updateMutation = useUpdateCheckliste();
  const deleteMutation = useDeleteCheckliste();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCheckliste, setEditingCheckliste] = useState<Checkliste | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typFilter, setTypFilter] = useState<"alle" | "allgemein" | "komponenten">("alle");
  // State für Komponenten-Autocomplete pro Item
  const [komponenteSearch, setKomponenteSearch] = useState<Record<number, string>>({});
  const [showKomponenteSuggestions, setShowKomponenteSuggestions] = useState<Record<number, boolean>>({});

  const form = useForm<ChecklisteFormData>({
    resolver: zodResolver(checklisteSchema),
    defaultValues: {
      name: "",
      typ: "allgemein",
      items: [{ id: "", text: "", komponenteIds: [] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const isLoading = contextLoading;

  // Dialog öffnen für neue Checkliste
  const handleNewCheckliste = () => {
    form.reset({
      name: "",
      typ: "allgemein",
      items: [{ id: "", text: "", komponenteIds: [] }],
    });
    setEditingCheckliste(null);
    setKomponenteSearch({});
    setShowKomponenteSuggestions({});
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditCheckliste = (checkliste: Checkliste) => {
    setEditingCheckliste(checkliste);
    form.reset({
      name: checkliste.name,
      typ: checkliste.typ,
      items: checkliste.items.length > 0 
        ? checkliste.items.map(item => {
            // Rückwärtskompatibilität: konvertiere komponenteId zu komponenteIds Array
            let komponenteIds: string[] = [];
            if (item.komponenteIds && Array.isArray(item.komponenteIds)) {
              komponenteIds = item.komponenteIds;
            } else if (item.komponenteId) {
              komponenteIds = [item.komponenteId];
            }
            return { 
              id: item.id, 
              text: item.text,
              komponenteIds,
            };
          })
        : [{ id: "", text: "", komponenteIds: [] }],
    });
    setKomponenteSearch({});
    setShowKomponenteSuggestions({});
    setIsDialogOpen(true);
  };

  // Prüfe ob eine ID eine UUID ist
  const isUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Checkliste speichern
  const onSubmit = async (data: ChecklisteFormData) => {
    // Validiere Items
    const validItems = data.items.filter((item) => item.text.trim() !== "");
    if (validItems.length === 0) {
      form.setError("items", { message: "Bitte fügen Sie mindestens ein Checklisten-Item hinzu." });
      return;
    }

    // Generiere IDs für Items ohne ID
    // WICHTIG: Text NICHT trimmen, damit Zeilenumbrüche erhalten bleiben!
    // trim() würde auch Zeilenumbrüche entfernen, daher verwenden wir den Original-Text
    const itemsWithIds = validItems.map((item, index) => ({
      id: item.id || `item-${Date.now()}-${index}`,
      text: item.text, // Original-Text behalten, keine Trim-Operation
      komponenteIds: item.komponenteIds && item.komponenteIds.length > 0 ? item.komponenteIds : undefined,
    }));

    try {
      if (editingCheckliste) {
        // Prüfe ob die Checkliste eine Fallback-ID hat (keine UUID)
        if (!isUUID(editingCheckliste.id)) {
          // Fallback-Checkliste: Erstelle sie zuerst in der Datenbank
          const neueCheckliste = await createMutation.mutateAsync({
            name: data.name.trim(),
            typ: data.typ,
            items: itemsWithIds,
          });
          // Entferne die alte Fallback-Checkliste und füge die neue hinzu
          deleteFromContext(editingCheckliste.id);
          addCheckliste(neueCheckliste);
          await refreshChecklisten();
        } else {
          // Normale Checkliste: Update
          const updated = await updateMutation.mutateAsync({
            id: editingCheckliste.id,
            data: {
              name: data.name.trim(),
              typ: data.typ,
              items: itemsWithIds,
            },
          });
          updateCheckliste(editingCheckliste.id, updated);
          await refreshChecklisten();
        }
      } else {
        const neueCheckliste = await createMutation.mutateAsync({
          name: data.name.trim(),
          typ: data.typ,
          items: itemsWithIds,
        });
        addCheckliste(neueCheckliste);
        await refreshChecklisten();
      }

      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      form.setError("root", {
        message: error.message || "Fehler beim Speichern",
      });
    }
  };

  // Checkliste löschen
  const handleDeleteCheckliste = async (checkliste: Checkliste) => {
    if (!confirm(`Möchten Sie die Checkliste "${checkliste.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      // Prüfe ob die Checkliste eine Fallback-ID hat (keine UUID)
      if (!isUUID(checkliste.id)) {
        // Fallback-Checkliste: Nur aus Context entfernen
        deleteFromContext(checkliste.id);
      } else {
        // Normale Checkliste: Aus Datenbank löschen
        await deleteMutation.mutateAsync(checkliste.id);
        deleteFromContext(checkliste.id);
        await refreshChecklisten();
      }
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
    }
  };

  // Gefilterte Checklisten
  const filteredChecklisten = checklisten.filter((checkliste) => {
    const matchesSearch =
      checkliste.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkliste.items.some((item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTyp = typFilter === "alle" || checkliste.typ === typFilter;
    return matchesSearch && matchesTyp;
  });

  const getTypBadge = (typ: "allgemein" | "komponenten") => {
    if (typ === "komponenten") return "bg-green-100 text-green-800";
    return "bg-slate-100 text-slate-800";
  };

  const getTypLabel = (typ: "allgemein" | "komponenten") => {
    if (typ === "komponenten") return "Komponenten";
    return "Allgemein";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Checklisten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Checklisten verwalten</h2>
          <p className="text-sm text-slate-600 mt-1">
            {checklisten.length} Checkliste{checklisten.length !== 1 ? "n" : ""} vorhanden
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCheckliste} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Checkliste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCheckliste
                  ? "Checkliste bearbeiten"
                  : "Neue Checkliste anlegen"}
              </DialogTitle>
              <DialogDescription>
                {editingCheckliste
                  ? "Bearbeiten Sie die Checkliste und ihre Items."
                  : "Erstellen Sie eine neue Checkliste. Wählen Sie 'Allgemein' für normale Aufgaben oder einen Abnahme-Typ."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="z.B. Standard Technische Abnahme"
                            disabled={createMutation.isPending || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="typ"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="allgemein">Allgemein</SelectItem>
                            <SelectItem value="komponenten">Komponenten</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Items */}
                <FormField
                  control={form.control}
                  name="items"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Checklisten-Items *</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ id: "", text: "", komponenteIds: [] })}
                          className="gap-2"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                          Item hinzufügen
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                        {fields.map((field, index) => {
                          const selectedKomponenteIds = form.watch(`items.${index}.komponenteIds`) || [];
                          const currentSearch = komponenteSearch[index] || "";
                          const showSuggestions = showKomponenteSuggestions[index] || false;
                          
                          // Filtere Komponenten basierend auf Suche (ohne useMemo, da in map-Funktion)
                          const filteredKomponenten = (() => {
                            if (!currentSearch.trim()) return [];
                            const searchLower = currentSearch.toLowerCase();
                            return komponenten.filter(
                              (k) =>
                                !selectedKomponenteIds.includes(k.id) &&
                                (k.name.toLowerCase().includes(searchLower) ||
                                  k.artikelNummer.toLowerCase().includes(searchLower))
                            ).slice(0, 5); // Maximal 5 Vorschläge
                          })();
                          
                          return (
                            <div key={field.id} className="space-y-3 p-3 border rounded-lg bg-slate-50">
                              {/* Komponenten-Autocomplete */}
                              <div className="relative">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <Input
                                    type="text"
                                    placeholder="Komponente suchen und auswählen (z.B. Thermostat Kühlen)..."
                                    value={currentSearch}
                                    onChange={(e) => {
                                      setKomponenteSearch({ ...komponenteSearch, [index]: e.target.value });
                                      setShowKomponenteSuggestions({ ...showKomponenteSuggestions, [index]: true });
                                    }}
                                    onFocus={() => setShowKomponenteSuggestions({ ...showKomponenteSuggestions, [index]: true })}
                                    onBlur={() => setTimeout(() => {
                                      setShowKomponenteSuggestions({ ...showKomponenteSuggestions, [index]: false });
                                    }, 200)}
                                    className="pl-10"
                                    disabled={createMutation.isPending || updateMutation.isPending || komponentenLoading}
                                  />
                                </div>
                                {showSuggestions && filteredKomponenten.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredKomponenten.map((komponente) => (
                                              <div
                                                key={komponente.id}
                                                className="p-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                                                onMouseDown={(e) => {
                                                  e.preventDefault(); // Verhindert onBlur
                                                  const currentIds = form.getValues(`items.${index}.komponenteIds`) || [];
                                                  if (!currentIds.includes(komponente.id)) {
                                                    // Füge Komponente zu komponenteIds hinzu
                                                    form.setValue(`items.${index}.komponenteIds`, [...currentIds, komponente.id]);
                                                    
                                                    // Füge Komponenten-Namen zum Text hinzu
                                                    const currentText = form.getValues(`items.${index}.text`) || "";
                                                    const komponenteText = `1x ${komponente.name}`;
                                                    
                                                    // Prüfe ob Komponente bereits im Text vorhanden ist
                                                    if (!currentText.includes(komponente.name)) {
                                                      // Füge am Ende hinzu, mit Zeilenumbruch wenn Text bereits vorhanden
                                                      const newText = currentText.trim() 
                                                        ? `${currentText.trim()}\n${komponenteText}`
                                                        : komponenteText;
                                                      form.setValue(`items.${index}.text`, newText);
                                                    }
                                                  }
                                                  setKomponenteSearch({ ...komponenteSearch, [index]: "" });
                                                  setShowKomponenteSuggestions({ ...showKomponenteSuggestions, [index]: false });
                                                }}
                                              >
                                        <div className="text-sm font-medium">{komponente.name}</div>
                                        <div className="text-xs text-slate-500">{komponente.artikelNummer}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.text`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            placeholder={`Item ${index + 1}...`}
                                            className="min-h-[60px]"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Ausgewählte Komponenten anzeigen */}
                              <FormField
                                control={form.control}
                                name={`items.${index}.komponenteIds`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Zugeordnete Komponenten {selectedKomponenteIds.length > 0 && `(${selectedKomponenteIds.length})`}
                                    </FormLabel>
                                    {selectedKomponenteIds.length > 0 ? (
                                      <div className="border rounded-lg p-3 bg-white">
                                        <div className="flex flex-wrap gap-2">
                                          {selectedKomponenteIds.map((komponenteId) => {
                                            const komponente = komponenten.find((k) => k.id === komponenteId);
                                            if (!komponente) return null;
                                            return (
                                              <Badge
                                                key={komponenteId}
                                                variant="secondary"
                                                className="flex items-center gap-1 pr-1"
                                              >
                                                <span>{komponente.name}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const currentIds = field.value || [];
                                                    field.onChange(currentIds.filter((id) => id !== komponenteId));
                                                  }}
                                                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                          Diese Komponenten werden beim Abhaken automatisch als abgeschlossen markiert (sofern sie im Projekt vorhanden sind).
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500">
                                        Keine Komponenten zugeordnet. Verwenden Sie das Suchfeld oben, um Komponenten hinzuzufügen.
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        {form.watch("items").filter((item) => item.text.trim() !== "").length} Item(s) ausgefüllt
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingCheckliste ? "Speichern" : "Anlegen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Checklisten durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typFilter} onValueChange={(value) => setTypFilter(value as typeof typFilter)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Typ filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Typen</SelectItem>
            <SelectItem value="allgemein">Allgemein</SelectItem>
            <SelectItem value="komponenten">Komponenten</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checklisten Liste */}
      {filteredChecklisten.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklisten.map((checkliste) => (
            <Card key={checkliste.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{checkliste.name}</CardTitle>
                    <div className="flex flex-col gap-2 mt-2">
                      <Badge className={getTypBadge(checkliste.typ)}>
                        {getTypLabel(checkliste.typ)}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {checkliste.items.length} Item{checkliste.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEditCheckliste(checkliste)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteCheckliste(checkliste)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checkliste.items.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-slate-400">{index + 1}.</span>
                      <span className="whitespace-pre-line" style={{ whiteSpace: 'pre-line' }}>{item.text}</span>
                    </div>
                  ))}
                  {checkliste.items.length > 5 && (
                    <p className="text-sm text-slate-500 italic">
                      ... und {checkliste.items.length - 5} weitere Item(s)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              {searchQuery || typFilter !== "alle"
                ? "Keine Checklisten gefunden."
                : "Noch keine Checklisten vorhanden."}
            </p>
            {!searchQuery && typFilter === "alle" && (
              <Button onClick={handleNewCheckliste} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Erste Checkliste anlegen
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

