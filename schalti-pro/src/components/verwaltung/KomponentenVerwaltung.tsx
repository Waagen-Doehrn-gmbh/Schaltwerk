"use client";

import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { komponenteApi } from "@/lib/api";
import type { Komponente } from "@/types";

export function KomponentenVerwaltung() {
  const [komponenten, setKomponenten] = useState<Komponente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Lade Komponenten vom Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const komponentenData = await komponenteApi.getAll();
        setKomponenten(komponentenData);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Daten");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  const [editingKomponente, setEditingKomponente] = useState<Komponente | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    artikelNummer: "",
  });

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      name: "",
      artikelNummer: "",
    });
    setEditingKomponente(null);
  };

  // Dialog öffnen für neue Komponente
  const handleNewKomponente = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditKomponente = (komponente: Komponente) => {
    setEditingKomponente(komponente);
    setFormData({
      name: komponente.name,
      artikelNummer: komponente.artikelNummer,
    });
    setIsDialogOpen(true);
  };

  // Komponente speichern
  const handleSaveKomponente = async () => {
    if (!formData.name || !formData.artikelNummer) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    try {
      if (editingKomponente) {
        // Komponente bearbeiten
        const updated = await komponenteApi.update(editingKomponente.id, {
          name: formData.name,
          artikelNummer: formData.artikelNummer,
        });
        setKomponenten((prev) =>
          prev.map((k) => (k.id === editingKomponente.id ? (updated as Komponente) : k))
        );
      } else {
        // Neue Komponente erstellen (ohne Projekt - wird später in Projekten zugeordnet)
        const neueKomponente = await komponenteApi.create({
          name: formData.name,
          artikelNummer: formData.artikelNummer,
        });
        setKomponenten((prev) => [...prev, neueKomponente as Komponente]);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert("Fehler beim Speichern: " + (error.message || "Unbekannter Fehler"));
      console.error("Error saving component:", error);
    }
  };

  // Komponente löschen
  const handleDeleteKomponente = async (komponente: Komponente) => {
    if (
      !confirm(
        `Möchten Sie die Komponente "${komponente.name}" wirklich löschen?`
      )
    ) {
      return;
    }
    
    try {
      await komponenteApi.delete(komponente.id);
      setKomponenten((prev) => prev.filter((k) => k.id !== komponente.id));
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
      console.error("Error deleting component:", error);
    }
  };

  // Gefilterte Komponenten
  const filteredKomponenten = komponenten.filter((k) => {
    return (
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.artikelNummer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Komponenten...</p>
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
          <h2 className="text-xl font-semibold text-slate-900">Komponenten verwalten</h2>
          <p className="text-sm text-slate-600 mt-1">
            {komponenten.length} Komponente{komponenten.length !== 1 ? "n" : ""} vorhanden
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewKomponente} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Komponente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingKomponente
                  ? "Komponente bearbeiten"
                  : "Neue Komponente anlegen"}
              </DialogTitle>
              <DialogDescription>
                {editingKomponente
                  ? "Bearbeiten Sie die Komponentendaten."
                  : "Erstellen Sie eine neue Komponente. Diese kann später in Projekten ausgewählt werden."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="komp-name">Komponentenname *</Label>
                <Input
                  id="komp-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Hauptschalter 63A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artikelNummer">Artikelnummer *</Label>
                <Input
                  id="artikelNummer"
                  value={formData.artikelNummer}
                  onChange={(e) =>
                    setFormData({ ...formData, artikelNummer: e.target.value })
                  }
                  placeholder="z.B. HS-63A-001"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Komponenten können später in Projekten ausgewählt und zugeordnet werden.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveKomponente}>
                {editingKomponente ? "Speichern" : "Anlegen"}
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
            placeholder="Komponenten durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Komponenten Liste */}
      {filteredKomponenten.length > 0 ? (
        <div className="space-y-3">
          {filteredKomponenten.map((komponente) => {
            return (
              <Card key={komponente.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-lg">{komponente.name}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {komponente.artikelNummer}
                      </p>
                      {komponente.projektId ? (
                        <p className="text-xs text-slate-500 mt-2">
                          Projekt zugeordnet
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-2">
                          Noch keinem Projekt zugeordnet
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleEditKomponente(komponente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteKomponente(komponente)}
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
              {searchQuery
                ? "Keine Komponenten gefunden."
                : "Noch keine Komponenten vorhanden."}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewKomponente} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Erste Komponente anlegen
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

