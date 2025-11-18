"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2, Search, ListChecks } from "lucide-react";
import { useAufgaben, useChecklisten, useCreateAufgabe, useUpdateAufgabe, useDeleteAufgabe } from "@/lib/hooks";
import type { Aufgabe } from "@/types";
import { Badge } from "@/components/ui/badge";

const aufgabeSchema = z.object({
  name: z.string().min(1, "Aufgabename ist erforderlich"),
  checklisteId: z.string().optional(),
});

type AufgabeFormData = z.infer<typeof aufgabeSchema>;

export function AufgabenVerwaltung() {
  const { data: aufgaben = [], isLoading: aufgabenLoading, error: aufgabenError } = useAufgaben();
  const { data: checklisten = [], isLoading: checklistenLoading } = useChecklisten();
  const createMutation = useCreateAufgabe();
  const updateMutation = useUpdateAufgabe();
  const deleteMutation = useDeleteAufgabe();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAufgabe, setEditingAufgabe] = useState<Aufgabe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<AufgabeFormData>({
    resolver: zodResolver(aufgabeSchema),
    defaultValues: {
      name: "",
      checklisteId: undefined,
    },
  });

  const isLoading = aufgabenLoading || checklistenLoading;
  const error = aufgabenError ? (aufgabenError as Error).message : null;

  // Dialog öffnen für neue Aufgabe
  const handleNewAufgabe = () => {
    form.reset({ name: "", checklisteId: undefined });
    setEditingAufgabe(null);
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditAufgabe = (aufgabe: Aufgabe) => {
    setEditingAufgabe(aufgabe);
    form.reset({
      name: aufgabe.name,
      checklisteId: aufgabe.checklisteId || undefined,
    });
    setIsDialogOpen(true);
  };

  // Aufgabe speichern
  const onSubmit = async (data: AufgabeFormData) => {
    try {
      if (editingAufgabe) {
        await updateMutation.mutateAsync({
          id: editingAufgabe.id,
          data: {
            name: data.name.trim(),
            checklisteId: data.checklisteId || undefined,
          },
        });
      } else {
        if (aufgaben.some((a) => a.name === data.name.trim())) {
          form.setError("name", { message: "Diese Aufgabe existiert bereits." });
          return;
        }
        await createMutation.mutateAsync({
          name: data.name.trim(),
          checklisteId: data.checklisteId || undefined,
        } as Omit<Aufgabe, "id">);
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      form.setError("root", {
        message: error.message || "Fehler beim Speichern",
      });
    }
  };

  // Aufgabe löschen
  const handleDeleteAufgabe = async (aufgabe: Aufgabe) => {
    if (!confirm(`Möchten Sie die Aufgabe "${aufgabe.name}" wirklich löschen?`)) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(aufgabe.id);
    } catch (error: any) {
      alert("Fehler beim Löschen: " + (error.message || "Unbekannter Fehler"));
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aufgabename *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="z.B. Komponenten eingebaut"
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
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Keine Checkliste" />
                          </SelectTrigger>
                        </FormControl>
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
                    {editingAufgabe ? "Speichern" : "Anlegen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
