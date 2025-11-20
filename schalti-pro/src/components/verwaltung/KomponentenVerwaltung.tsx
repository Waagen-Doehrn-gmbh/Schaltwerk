"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useKomponenten, useCreateKomponente, useUpdateKomponente, useDeleteKomponente } from "@/lib/hooks";
import type { Komponente } from "@/types";
import { useChecklistenOptional } from "@/components/verwaltung/ChecklistenContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const komponenteSchema = z.object({
  name: z.string().min(1, "Komponentenname ist erforderlich"),
  artikelNummer: z.string().min(1, "Artikelnummer ist erforderlich"),
  checklisteId: z.string().optional(),
});

type KomponenteFormData = z.infer<typeof komponenteSchema>;

export function KomponentenVerwaltung() {
  const { data: komponenten = [], isLoading, error: komponentenError } = useKomponenten();
  const createMutation = useCreateKomponente();
  const updateMutation = useUpdateKomponente();
  const deleteMutation = useDeleteKomponente();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKomponente, setEditingKomponente] = useState<Komponente | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const checklistenContext = useChecklistenOptional();
  const checklisten = checklistenContext?.checklisten || [];
  const komponentenChecklisten = checklisten.filter((c) => c.typ === "komponenten");

  const form = useForm<KomponenteFormData>({
    resolver: zodResolver(komponenteSchema),
    defaultValues: {
      name: "",
      artikelNummer: "",
      checklisteId: "",
    },
  });

  // Dialog öffnen für neue Komponente
  const handleNewKomponente = () => {
    form.reset();
    setEditingKomponente(null);
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditKomponente = (komponente: Komponente) => {
    setEditingKomponente(komponente);
    form.reset({
      name: komponente.name,
      artikelNummer: komponente.artikelNummer,
      checklisteId: komponente.checklisteId || "",
    });
    setIsDialogOpen(true);
  };

  // Komponente speichern
  const onSubmit = async (data: KomponenteFormData) => {
    try {
      // Leere checklisteId als undefined behandeln
      const submitData = {
        ...data,
        checklisteId: data.checklisteId && data.checklisteId.trim() !== "" ? data.checklisteId : undefined,
      };
      
      if (editingKomponente) {
        await updateMutation.mutateAsync({
          id: editingKomponente.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      form.setError("root", {
        message: error.message || "Fehler beim Speichern",
      });
    }
  };

  // Komponente löschen
  const handleDeleteKomponente = async (komponente: Komponente) => {
    if (!confirm(`Möchten Sie die Komponente "${komponente.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(komponente.id);
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
    }
  };

  // Gefilterte Komponenten
  const filteredKomponenten = komponenten.filter((k) => {
    return (
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.artikelNummer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const error = komponentenError ? (komponentenError as Error).message : null;

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Komponentenname *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. Hauptschalter 63A"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="artikelNummer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artikelnummer *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. HS-63A-001"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checklisteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checkliste (optional)</FormLabel>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Keine Checkliste zuordnen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Keine Checkliste</SelectItem>
                          {komponentenChecklisten.map((checkliste) => (
                            <SelectItem key={checkliste.id} value={checkliste.id}>
                              {checkliste.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">
                        Wenn eine Checkliste zugeordnet ist, muss diese vollständig abgearbeitet werden, bevor die Komponente als eingebaut markiert werden kann.
                      </p>
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                  Komponenten können später in Projekten ausgewählt und zugeordnet werden.
                </p>
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
                    {editingKomponente ? "Speichern" : "Anlegen"}
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
            placeholder="Komponenten durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Komponenten Liste */}
      {filteredKomponenten.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKomponenten.map((komponente) => {
            const zugeordneteCheckliste = komponente.checklisteId
              ? komponentenChecklisten.find((c) => c.id === komponente.checklisteId)
              : null;
            
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
                      {zugeordneteCheckliste && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Checkliste: {zugeordneteCheckliste.name}
                        </Badge>
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

