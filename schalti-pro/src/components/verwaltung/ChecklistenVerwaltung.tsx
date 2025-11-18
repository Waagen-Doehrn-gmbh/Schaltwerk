"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { checklisteApi, type Checkliste } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useChecklisten } from "@/components/verwaltung/ChecklistenContext";

export function ChecklistenVerwaltung() {
  const { checklisten, updateCheckliste, addCheckliste, deleteCheckliste: deleteFromContext, isLoading: contextLoading, refreshChecklisten } = useChecklisten();
  const isLoading = contextLoading;
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCheckliste, setEditingCheckliste] = useState<Checkliste | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typFilter, setTypFilter] = useState<"alle" | "technisch" | "endabnahme" | "allgemein">("alle");
  const [formData, setFormData] = useState({
    name: "",
    typ: "allgemein" as "technisch" | "endabnahme" | "allgemein",
    items: [{ id: "", text: "" }] as { id: string; text: string }[],
  });

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      name: "",
      typ: "allgemein",
      items: [{ id: "", text: "" }],
    });
    setEditingCheckliste(null);
  };

  // Dialog öffnen für neue Checkliste
  const handleNewCheckliste = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditCheckliste = (checkliste: Checkliste) => {
    setEditingCheckliste(checkliste);
    setFormData({
      name: checkliste.name,
      typ: checkliste.typ,
      items: checkliste.items.length > 0 
        ? checkliste.items 
        : [{ id: "", text: "" }],
    });
    setIsDialogOpen(true);
  };

  // Checkliste speichern
  const handleSaveCheckliste = async () => {
    if (!formData.name.trim()) {
      alert("Bitte geben Sie einen Namen für die Checkliste ein.");
      return;
    }

    // Validiere Items
    const validItems = formData.items.filter((item) => item.text.trim() !== "");
    if (validItems.length === 0) {
      alert("Bitte fügen Sie mindestens ein Checklisten-Item hinzu.");
      return;
    }

    // Generiere IDs für Items ohne ID
    const itemsWithIds = validItems.map((item, index) => ({
      id: item.id || `item-${Date.now()}-${index}`,
      text: item.text.trim(),
    }));

    try {
      if (editingCheckliste) {
        // Checkliste bearbeiten
        const updated = await checklisteApi.update(editingCheckliste.id, {
          name: formData.name.trim(),
          typ: formData.typ,
          items: itemsWithIds,
        });
        updateCheckliste(editingCheckliste.id, updated);
        // Aktualisiere auch den Context
        await refreshChecklisten();
      } else {
        // Neue Checkliste erstellen
        const neueCheckliste = await checklisteApi.create({
          name: formData.name.trim(),
          typ: formData.typ,
          items: itemsWithIds,
        });
        addCheckliste(neueCheckliste);
        // Aktualisiere auch den Context
        await refreshChecklisten();
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert("Fehler beim Speichern: " + (error.message || "Unbekannter Fehler"));
      console.error("Error saving checklist:", error);
    }
  };

  // Checkliste löschen
  const handleDeleteCheckliste = async (checkliste: Checkliste) => {
    if (
      !confirm(
        `Möchten Sie die Checkliste "${checkliste.name}" wirklich löschen?`
      )
    ) {
      return;
    }
    
    try {
      await checklisteApi.delete(checkliste.id);
      deleteFromContext(checkliste.id);
      // Aktualisiere auch den Context
      await refreshChecklisten();
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
      console.error("Error deleting checklist:", error);
    }
  };

  // Item hinzufügen
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: "", text: "" }],
    }));
  };

  // Item entfernen
  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Item aktualisieren
  const handleUpdateItem = (index: number, text: string) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], text };
      return { ...prev, items: updated };
    });
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

  const getTypBadge = (typ: "technisch" | "endabnahme" | "allgemein") => {
    if (typ === "technisch") return "bg-blue-100 text-blue-800";
    if (typ === "endabnahme") return "bg-purple-100 text-purple-800";
    return "bg-slate-100 text-slate-800";
  };

  const getTypLabel = (typ: "technisch" | "endabnahme" | "allgemein") => {
    if (typ === "technisch") return "Technische Abnahme";
    if (typ === "endabnahme") return "Endabnahme";
    return "Allgemein";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Checklisten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Fehler: {error}</p>
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkliste-name">Name *</Label>
                  <Input
                    id="checkliste-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="z.B. Standard Technische Abnahme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkliste-typ">Typ *</Label>
                  <Select
                    value={formData.typ}
                    onValueChange={(value: "technisch" | "endabnahme" | "allgemein") =>
                      setFormData({ ...formData, typ: value })
                    }
                  >
                    <SelectTrigger id="checkliste-typ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allgemein">Allgemein</SelectItem>
                      <SelectItem value="technisch">Technische Abnahme</SelectItem>
                      <SelectItem value="endabnahme">Endabnahme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Checklisten-Items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Item hinzufügen
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Textarea
                          value={item.text}
                          onChange={(e) => handleUpdateItem(index, e.target.value)}
                          placeholder={`Item ${index + 1}...`}
                          className="min-h-[60px]"
                        />
                      </div>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {formData.items.filter((item) => item.text.trim() !== "").length} Item(s) ausgefüllt
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveCheckliste}>
                {editingCheckliste ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
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
            <SelectItem value="technisch">Technische Abnahme</SelectItem>
            <SelectItem value="endabnahme">Endabnahme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checklisten Liste */}
      {filteredChecklisten.length > 0 ? (
        <div className="space-y-3">
          {filteredChecklisten.map((checkliste) => (
            <Card key={checkliste.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{checkliste.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
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
                      <span>{item.text}</span>
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

