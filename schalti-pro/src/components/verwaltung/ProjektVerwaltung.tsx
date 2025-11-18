"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, QrCode } from "lucide-react";
import { useProjekte, useKomponenten, useMe, useCreateProjekt, useUpdateProjekt, useDeleteProjekt } from "@/lib/hooks";
import type { Projekt, ProjektStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { QRCodeDialog } from "@/components/projekt/QRCodeDialog";

const projektSchema = z.object({
  name: z.string().min(1, "Projektname ist erforderlich"),
  standort: z.string().min(1, "Standort ist erforderlich"),
  status: z.enum(["planung", "in_bearbeitung", "abgeschlossen"]),
  schaltschrankNummer: z.string().min(1, "Schaltschranknummer ist erforderlich"),
  komponentenIds: z.array(z.string()),
});

type ProjektFormData = z.infer<typeof projektSchema>;

export function ProjektVerwaltung() {
  const { data: projekte = [], isLoading: projekteLoading, error: projekteError } = useProjekte();
  const { data: komponenten = [], isLoading: komponentenLoading } = useKomponenten();
  const { data: currentUser } = useMe();
  const createMutation = useCreateProjekt();
  const updateMutation = useUpdateProjekt();
  const deleteMutation = useDeleteProjekt();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProjekt, setEditingProjekt] = useState<Projekt | null>(null);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [projektForQR, setProjektForQR] = useState<{ id: string; name: string; schaltschrankNummer?: string } | null>(null);

  const form = useForm<ProjektFormData>({
    resolver: zodResolver(projektSchema),
    defaultValues: {
      name: "",
      standort: "",
      status: "planung",
      schaltschrankNummer: "",
      komponentenIds: [],
    },
  });

  const isLoading = projekteLoading || komponentenLoading;
  const error = projekteError ? (projekteError as Error).message : null;

  // Dialog öffnen für neues Projekt
  const handleNewProjekt = () => {
    form.reset({
      name: "",
      standort: "",
      status: "planung",
      schaltschrankNummer: "",
      komponentenIds: [],
    });
    setEditingProjekt(null);
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditProjekt = (projekt: Projekt) => {
    setEditingProjekt(projekt);
    form.reset({
      name: projekt.name,
      standort: projekt.standort,
      status: projekt.status,
      schaltschrankNummer: projekt.schaltschrankNummer || "",
      komponentenIds: projekt.komponentenIds || [],
    });
    setIsDialogOpen(true);
  };

  // Komponente auswählen/abwählen
  const handleKomponenteToggle = (komponenteId: string, checked: boolean) => {
    const currentIds = form.getValues("komponentenIds");
    const newIds = checked
      ? [...currentIds, komponenteId]
      : currentIds.filter((id) => id !== komponenteId);
    form.setValue("komponentenIds", newIds);
  };

  // Projekt speichern
  const onSubmit = async (data: ProjektFormData) => {
    try {
      if (editingProjekt) {
        await updateMutation.mutateAsync({
          id: editingProjekt.id,
          data: {
            name: data.name,
            standort: data.standort,
            status: data.status,
            schaltschrankNummer: data.schaltschrankNummer,
            komponentenIds: data.komponentenIds,
          },
        });
      } else {
        const neuesProjekt = await createMutation.mutateAsync({
          name: data.name,
          standort: data.standort,
          status: "planung",
          schaltschrankNummer: data.schaltschrankNummer,
          komponentenIds: data.komponentenIds,
        });
        
        const transformed = neuesProjekt as any;
        setProjektForQR({ 
          id: transformed.id, 
          name: transformed.name,
          schaltschrankNummer: transformed.schaltschrankNummer 
        });
        setQrCodeDialogOpen(true);
      }

      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      form.setError("root", {
        message: error.message || "Fehler beim Speichern",
      });
    }
  };

  // Projekt löschen
  const handleDeleteProjekt = async (projekt: Projekt) => {
    if (!confirm(`Möchten Sie das Projekt "${projekt.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(projekt.id);
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projektname *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. Bolz Einfahrt"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="standort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standort *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. Dorsten"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editingProjekt && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
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
                            <SelectItem value="planung">Planung</SelectItem>
                            <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                            <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    <FormField
                      control={form.control}
                      name="schaltschrankNummer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schaltschranknummer *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. SS-2024-001"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="komponentenIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Komponenten auswählen</FormLabel>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                        {komponenten.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-muted-foreground text-center py-4">
                            Keine Komponenten verfügbar. Bitte legen Sie zuerst Komponenten an.
                          </p>
                        ) : (
                          komponenten.map((komponente) => {
                            const komponentenIds = form.watch("komponentenIds");
                            const isChecked = komponentenIds.includes(komponente.id);
                            return (
                              <div
                                key={komponente.id}
                                className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded"
                              >
                                <Checkbox
                                  id={`komp-${komponente.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handleKomponenteToggle(komponente.id, checked as boolean)}
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
                            );
                          })
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">
                        {form.watch("komponentenIds").length} Komponente{form.watch("komponentenIds").length !== 1 ? "n" : ""} ausgewählt
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
                    {editingProjekt ? "Speichern" : "Anlegen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
