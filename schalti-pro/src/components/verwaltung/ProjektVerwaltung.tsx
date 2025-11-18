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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, QrCode } from "lucide-react";
import { projektApi, komponenteApi, authApi } from "@/lib/api";
import type { Projekt, ProjektStatus, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { QRCodeDialog } from "@/components/projekt/QRCodeDialog";

export function ProjektVerwaltung() {
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [komponenten, setKomponenten] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProjekt, setEditingProjekt] = useState<Projekt | null>(null);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [projektForQR, setProjektForQR] = useState<{ id: string; name: string; schaltschrankNummer?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    standort: "",
    status: "planung" as ProjektStatus,
    schaltschrankNummer: "",
    komponentenIds: [] as string[],
  });

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      name: "",
      standort: "",
      status: "planung",
      schaltschrankNummer: "",
      komponentenIds: [],
    });
    setEditingProjekt(null);
  };

  // Dialog öffnen für neues Projekt
  const handleNewProjekt = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditProjekt = (projekt: Projekt) => {
    console.log("handleEditProjekt called with:", projekt);
    console.log("projekt.komponentenIds:", projekt.komponentenIds);
    setEditingProjekt(projekt);
    setFormData({
      name: projekt.name,
      standort: projekt.standort,
      status: projekt.status,
      schaltschrankNummer: projekt.schaltschrankNummer || "",
      komponentenIds: projekt.komponentenIds || [],
    });
    console.log("FormData set to:", {
      name: projekt.name,
      standort: projekt.standort,
      status: projekt.status,
      schaltschrankNummer: projekt.schaltschrankNummer || "",
      komponentenIds: projekt.komponentenIds || [],
    });
    setIsDialogOpen(true);
  };

  // Lade Projekte und Komponenten vom Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projekteData, komponentenData, userData] = await Promise.all([
          projektApi.getAll(),
          komponenteApi.getAll(),
          authApi.getMe().catch(() => null),
        ]);
        
        if (userData) {
          setCurrentUser(userData as User);
        }
        
        const transformed = projekteData.map((p: any) => {
          const komponentenIds = p.komponenten_ids || p.komponentenIds || [];
          console.log(`Project ${p.name} - komponenten_ids from API:`, p.komponenten_ids, "komponentenIds:", p.komponentenIds, "final:", komponentenIds);
          return {
            ...p,
            createdAt: new Date(p.created_at || p.createdAt),
            stats: p.stats || {
              stunden: 0,
              eintraege: 0,
              komponenten: 0,
              gesamtKomponenten: 0,
            },
            schaltschrankNummer: p.schaltschrank_nummer || p.schaltschrankNummer,
            komponentenIds: komponentenIds,
          };
        });
        
        console.log("Transformed projects:", transformed);
        setProjekte(transformed);
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

  // Komponente auswählen/abwählen
  const handleKomponenteToggle = (komponenteId: string) => {
    console.log("handleKomponenteToggle called with:", komponenteId);
    setFormData((prev) => {
      const isSelected = prev.komponentenIds.includes(komponenteId);
      console.log("Current komponentenIds:", prev.komponentenIds);
      console.log("Is selected:", isSelected);
      const newKomponentenIds = isSelected
        ? prev.komponentenIds.filter((id) => id !== komponenteId)
        : [...prev.komponentenIds, komponenteId];
      console.log("New komponentenIds:", newKomponentenIds);
      return {
        ...prev,
        komponentenIds: newKomponentenIds,
      };
    });
  };

  // Projekt speichern
  const handleSaveProjekt = async () => {
    console.log("handleSaveProjekt called");
    console.log("formData:", formData);
    
    if (!formData.name || !formData.standort) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    try {
      if (editingProjekt) {
        // Projekt bearbeiten
        const updateData = {
          name: formData.name,
          standort: formData.standort,
          status: formData.status,
          schaltschrankNummer: formData.schaltschrankNummer || undefined,
          komponentenIds: formData.komponentenIds,
        };
        console.log("Sending update data:", JSON.stringify(updateData, null, 2));
        const updated = await projektApi.update(editingProjekt.id, updateData);
        console.log("Received updated project:", updated);
        console.log("komponentenIds from API:", (updated as any).komponenten_ids || (updated as any).komponentenIds);
        
        const transformed = {
          ...(updated as any),
          createdAt: new Date((updated as any).created_at || (updated as any).createdAt),
          stats: (updated as any).stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
          schaltschrankNummer: (updated as any).schaltschrank_nummer || (updated as any).schaltschrankNummer,
          komponentenIds: (updated as any).komponenten_ids || (updated as any).komponentenIds || [],
        };
        
        console.log("Transformed project with komponentenIds:", transformed.komponentenIds);
        
        setProjekte((prev) =>
          prev.map((p) => (p.id === editingProjekt.id ? transformed : p))
        );
        
        // Lade die Daten neu, um sicherzustellen, dass alles synchronisiert ist
        const [projekteData] = await Promise.all([
          projektApi.getAll(),
        ]);
        const refreshed = projekteData.map((p: any) => ({
          ...p,
          createdAt: new Date(p.created_at || p.createdAt),
          stats: p.stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
          schaltschrankNummer: p.schaltschrank_nummer || p.schaltschrankNummer,
          komponentenIds: p.komponenten_ids || p.komponentenIds || [],
        }));
        setProjekte(refreshed);
      } else {
        // Neues Projekt erstellen
        const neuesProjekt = await projektApi.create({
          name: formData.name,
          standort: formData.standort,
          status: "planung",
          schaltschrankNummer: formData.schaltschrankNummer || undefined,
          komponentenIds: formData.komponentenIds,
        });
        
        const transformed = {
          ...(neuesProjekt as any),
          createdAt: new Date((neuesProjekt as any).created_at || (neuesProjekt as any).createdAt),
          stats: (neuesProjekt as any).stats || {
            stunden: 0,
            eintraege: 0,
            komponenten: 0,
            gesamtKomponenten: 0,
          },
          schaltschrankNummer: (neuesProjekt as any).schaltschrank_nummer || (neuesProjekt as any).schaltschrankNummer,
          komponentenIds: (neuesProjekt as any).komponenten_ids || (neuesProjekt as any).komponentenIds || [],
        };
        
        setProjekte((prev) => [...prev, transformed]);
        
        // QR-Code-Dialog für neues Projekt öffnen
        setProjektForQR({ 
          id: transformed.id, 
          name: transformed.name,
          schaltschrankNummer: transformed.schaltschrankNummer 
        });
        setQrCodeDialogOpen(true);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert("Fehler beim Speichern: " + (error.message || "Unbekannter Fehler"));
      console.error("Error saving project:", error);
    }
  };

  // Projekt löschen
  const handleDeleteProjekt = async (projekt: Projekt) => {
    if (!confirm(`Möchten Sie das Projekt "${projekt.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      await projektApi.delete(projekt.id);
      setProjekte((prev) => prev.filter((p) => p.id !== projekt.id));
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
      console.error("Error deleting project:", error);
    }
  };

  // QR-Code für Projekt anzeigen
  const handleShowQRCode = (projekt: Projekt) => {
    setProjektForQR({ 
      id: projekt.id, 
      name: projekt.name,
      schaltschrankNummer: projekt.schaltschrankNummer 
    });
    setQrCodeDialogOpen(true);
  };

  const getStatusBadge = (status: ProjektStatus) => {
    const variants: Record<ProjektStatus, string> = {
      planung: "bg-yellow-100 text-yellow-800",
      in_bearbeitung: "bg-blue-100 text-blue-800",
      abgeschlossen: "bg-green-100 text-green-800",
    };
    return variants[status] || "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status: ProjektStatus) => {
    const labels: Record<ProjektStatus, string> = {
      planung: "Planung",
      in_bearbeitung: "In Bearbeitung",
      abgeschlossen: "Abgeschlossen",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-muted-foreground">Lade Projekte...</p>
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-foreground">Projekte verwalten</h2>
          <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1">
            {projekte.length} Projekt{projekte.length !== 1 ? "e" : ""} vorhanden
          </p>
        </div>
        {currentUser?.rolle === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProjekt} className="gap-2">
                <Plus className="h-4 w-4" />
                Neues Projekt
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProjekt ? "Projekt bearbeiten" : "Neues Projekt anlegen"}
              </DialogTitle>
              <DialogDescription>
                {editingProjekt
                  ? "Bearbeiten Sie die Projektdaten."
                  : "Erstellen Sie ein neues Projekt für einen Schaltschrank-Auftrag. Neue Projekte werden automatisch auf 'Planung' gesetzt."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Projektname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Bolz Einfahrt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standort">Standort *</Label>
                <Input
                  id="standort"
                  value={formData.standort}
                  onChange={(e) => setFormData({ ...formData, standort: e.target.value })}
                  placeholder="z.B. Dorsten"
                />
              </div>
              {editingProjekt && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjektStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planung">Planung</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!editingProjekt && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value="Planung"
                    disabled
                    className="bg-slate-100"
                  />
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    Neue Projekte werden automatisch auf "Planung" gesetzt.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="schaltschrankNummer">Schaltschranknummer</Label>
                <Input
                  id="schaltschrankNummer"
                  value={formData.schaltschrankNummer}
                  onChange={(e) =>
                    setFormData({ ...formData, schaltschrankNummer: e.target.value })
                  }
                  placeholder="z.B. SS-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Komponenten auswählen</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {komponenten.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-muted-foreground text-center py-4">
                      Keine Komponenten verfügbar. Bitte legen Sie zuerst Komponenten an.
                    </p>
                  ) : (
                    komponenten.map((komponente) => (
                      <div
                        key={komponente.id}
                        className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded"
                      >
                        <Checkbox
                          id={`komp-${komponente.id}`}
                          checked={formData.komponentenIds.includes(komponente.id)}
                          onCheckedChange={() => handleKomponenteToggle(komponente.id)}
                        />
                        <label
                          htmlFor={`komp-${komponente.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span>{komponente.name}</span>
                            <span className="text-xs text-slate-500 dark:text-muted-foreground ml-2">
                              {komponente.artikelNummer}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                  {formData.komponentenIds.length} Komponente{formData.komponentenIds.length !== 1 ? "n" : ""} ausgewählt
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveProjekt}>
                {editingProjekt ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Projekte Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projekte.map((projekt) => (
          <Card key={projekt.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{projekt.name}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1">{projekt.standort}</p>
                </div>
                <Badge className={getStatusBadge(projekt.status)}>
                  {getStatusLabel(projekt.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                {projekt.schaltschrankNummer && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-muted-foreground">Schaltschrank-Nr.:</span>
                    <span className="font-medium">{projekt.schaltschrankNummer}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-muted-foreground">Komponenten:</span>
                  <span className="font-medium">
                    {projekt.stats.komponenten} / {projekt.stats.gesamtKomponenten}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-muted-foreground">Erstellt:</span>
                  <span className="font-medium">
                    {format(projekt.createdAt, "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleEditProjekt(projekt)}
                >
                  <Edit className="h-4 w-4" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShowQRCode(projekt)}
                  title="QR-Code anzeigen"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteProjekt(projekt)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projekte.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 dark:text-muted-foreground">Noch keine Projekte vorhanden.</p>
            <Button onClick={handleNewProjekt} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Erstes Projekt anlegen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR-Code Dialog */}
      {projektForQR && (
        <QRCodeDialog
          open={qrCodeDialogOpen}
          onOpenChange={(open) => {
            setQrCodeDialogOpen(open);
            if (!open) {
              setProjektForQR(null);
            }
          }}
          projektId={projektForQR.id}
          projektName={projektForQR.name}
          schaltschrankNummer={projektForQR.schaltschrankNummer}
        />
      )}
    </div>
  );
}
