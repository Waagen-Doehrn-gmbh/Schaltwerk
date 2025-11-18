"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Search, ListChecks } from "lucide-react";
import { aufgabeApi, checklisteApi, type Checkliste } from "@/lib/api";
import type { Aufgabe } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export function AufgabenVerwaltung() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [checklisten, setChecklisten] = useState<Checkliste[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAufgabe, setEditingAufgabe] = useState<Aufgabe | null>(null);
  
  // Lade Aufgaben und Checklisten vom Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [aufgabenData, checklistenData] = await Promise.all([
          aufgabeApi.getAll(),
          checklisteApi.getAll(),
        ]);
        setAufgaben(aufgabenData);
        setChecklisten(checklistenData);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Daten");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  const [formData, setFormData] = useState({ name: "", checklisteId: "none" });
  const [searchQuery, setSearchQuery] = useState("");

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({ name: "", checklisteId: "none" });
    setEditingAufgabe(null);
  };

  // Dialog öffnen für neue Aufgabe
  const handleNewAufgabe = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditAufgabe = (aufgabe: Aufgabe) => {
    setEditingAufgabe(aufgabe);
    setFormData({ name: aufgabe.name, checklisteId: aufgabe.checklisteId || "none" });
    setIsDialogOpen(true);
  };

  // Aufgabe speichern
  const handleSaveAufgabe = async () => {
    if (!formData.name.trim()) {
      alert("Bitte geben Sie einen Aufgabennamen ein.");
      return;
    }

    try {
      if (editingAufgabe) {
        // Aufgabe bearbeiten
        const updated = await aufgabeApi.update(editingAufgabe.id, {
          name: formData.name.trim(),
          checklisteId: formData.checklisteId === "none" ? undefined : formData.checklisteId,
        });
        setAufgaben((prev) =>
          prev.map((a) => (a.id === editingAufgabe.id ? updated : a))
        );
      } else {
        // Neue Aufgabe erstellen
        if (aufgaben.some((a) => a.name === formData.name.trim())) {
          alert("Diese Aufgabe existiert bereits.");
          return;
        }
        const neueAufgabe = await aufgabeApi.create({
          name: formData.name.trim(),
          checklisteId: formData.checklisteId === "none" ? undefined : formData.checklisteId,
        });
        setAufgaben((prev) => [...prev, neueAufgabe]);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert("Fehler beim Speichern: " + (error.message || "Unbekannter Fehler"));
      console.error("Error saving task:", error);
    }
  };

  // Aufgabe löschen
  const handleDeleteAufgabe = async (aufgabe: Aufgabe) => {
    if (
      !confirm(
        `Möchten Sie die Aufgabe "${aufgabe.name}" wirklich löschen?`
      )
    ) {
      return;
    }
    
    try {
      await aufgabeApi.delete(aufgabe.id);
      setAufgaben((prev) => prev.filter((a) => a.id !== aufgabe.id));
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
      console.error("Error deleting task:", error);
    }
  };

  // Gefilterte Aufgaben
  const filteredAufgaben = aufgaben.filter((aufgabe) =>
    aufgabe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Finde Checkliste-Name
  const getChecklisteName = (checklisteId?: string) => {
    if (!checklisteId) return null;
    return checklisten.find((c) => c.id === checklisteId)?.name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Aufgaben...</p>
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
          <h2 className="text-xl font-semibold text-slate-900">Aufgaben verwalten</h2>
          <p className="text-sm text-slate-600 mt-1">
            {aufgaben.length} Aufgabe{aufgaben.length !== 1 ? "n" : ""} vorhanden
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewAufgabe} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAufgabe ? "Aufgabe bearbeiten" : "Neue Aufgabe anlegen"}
              </DialogTitle>
              <DialogDescription>
                {editingAufgabe
                  ? "Bearbeiten Sie den Aufgabennamen und die zugeordnete Checkliste."
                  : "Erstellen Sie eine neue Aufgabe. Optional können Sie eine Checkliste zuordnen."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="aufgabe-name">Aufgabename *</Label>
                <Input
                  id="aufgabe-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Komponenten eingebaut"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveAufgabe();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aufgabe-checkliste">Checkliste (optional)</Label>
                <Select
                  value={formData.checklisteId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, checklisteId: value })
                  }
                >
                  <SelectTrigger id="aufgabe-checkliste">
                    <SelectValue placeholder="Keine Checkliste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Checkliste</SelectItem>
                    {checklisten.map((checkliste) => {
                      const typLabel = 
                        checkliste.typ === "technisch" ? "Technisch" :
                        checkliste.typ === "endabnahme" ? "Endabnahme" :
                        "Allgemein";
                      return (
                        <SelectItem key={checkliste.id} value={checkliste.id}>
                          {checkliste.name} ({typLabel})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Wählen Sie eine Checkliste, die bei dieser Aufgabe verwendet werden soll.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveAufgabe}>
                {editingAufgabe ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Aufgaben durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Aufgaben Liste */}
      {filteredAufgaben.length > 0 ? (
        <div className="space-y-2">
          {filteredAufgaben.map((aufgabe) => {
            const checklisteName = getChecklisteName(aufgabe.checklisteId);
            return (
              <Card key={aufgabe.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900">{aufgabe.name}</p>
                        {checklisteName && (
                          <Badge variant="outline" className="gap-1">
                            <ListChecks className="h-3 w-3" />
                            {checklisteName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleEditAufgabe(aufgabe)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAufgabe(aufgabe)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              {searchQuery ? "Keine Aufgaben gefunden." : "Noch keine Aufgaben vorhanden."}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewAufgabe} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Erste Aufgabe anlegen
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
