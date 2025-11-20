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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useUsers, useMe, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/hooks";
import type { User, UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";

const userSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().optional(),
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  initialen: z.string().min(2, "Initialen müssen mindestens 2 Zeichen lang sein").max(10, "Initialen dürfen maximal 10 Zeichen lang sein"),
  rolle: z.enum(["admin", "analyse", "endabnahme", "technische_abnahme", "monteur"]),
}).refine((data) => {
  // Passwort ist nur beim Erstellen erforderlich
  return true;
});

type UserFormData = z.infer<typeof userSchema>;

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  analyse: "Analyse",
  endabnahme: "Endabnahme",
  technische_abnahme: "Technische Abnahme",
  monteur: "Monteur",
};

export function BenutzerVerwaltung() {
  const { data: benutzer = [], isLoading, error: usersError } = useUsers();
  const { data: currentUser } = useMe();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      initialen: "",
      rolle: "monteur",
    },
  });

  const error = usersError ? (usersError as Error).message : null;

  // Dialog öffnen für neuen Benutzer
  const handleNewUser = () => {
    form.reset({
      email: "",
      password: "",
      name: "",
      initialen: "",
      rolle: "monteur",
    });
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({
      email: user.email || "",
      password: "",
      name: user.name,
      initialen: user.initialen,
      rolle: user.rolle,
    });
    setIsDialogOpen(true);
  };

  // Benutzer speichern (erstellen oder aktualisieren)
  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        const updateData: any = {
          email: data.email,
          name: data.name,
          initialen: data.initialen,
          rolle: data.rolle,
        };
        if (data.password && data.password.length > 0) {
          updateData.password = data.password;
        }
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: updateData,
        });
      } else {
        if (!data.password || data.password.length < 6) {
          form.setError("password", { message: "Passwort muss mindestens 6 Zeichen lang sein" });
          return;
        }
        await createMutation.mutateAsync({
          email: data.email,
          password: data.password,
          name: data.name,
          initialen: data.initialen,
          rolle: data.rolle,
        });
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (err: any) {
      form.setError("root", {
        message: err.message || "Fehler beim Speichern des Benutzers",
      });
    }
  };

  // Benutzer löschen
  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich löschen?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      alert("Fehler beim Löschen: " + (err.message || "Unbekannter Fehler"));
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Lade Benutzer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Header mit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-foreground">
            Benutzerverwaltung
          </h2>
          <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Verwalten Sie Benutzer, Rollen und Passwörter
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewUser} className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Benutzer bearbeiten" : "Neuen Benutzer anlegen"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Bearbeiten Sie die Benutzerdaten. Lassen Sie das Passwort leer, um es nicht zu ändern."
                  : "Erstellen Sie einen neuen Benutzer mit E-Mail, Passwort und Rolle."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="benutzer@example.com"
                            disabled={createMutation.isPending || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Passwort {editingUser ? "(optional)" : "*"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder={editingUser ? "Leer lassen zum Beibehalten" : "Mindestens 6 Zeichen"}
                            disabled={createMutation.isPending || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                            placeholder="Max Mustermann"
                            disabled={createMutation.isPending || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="initialen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initialen *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="MM"
                            maxLength={10}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            disabled={createMutation.isPending || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rolle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle *</FormLabel>
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
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="analyse">Analyse</SelectItem>
                          <SelectItem value="endabnahme">Endabnahme</SelectItem>
                          <SelectItem value="technische_abnahme">Technische Abnahme</SelectItem>
                          <SelectItem value="monteur">Monteur</SelectItem>
                        </SelectContent>
                      </Select>
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
                    {editingUser ? "Aktualisieren" : "Erstellen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Benutzerliste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alle Benutzer ({benutzer.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {benutzer.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Benutzer vorhanden.</p>
              <p className="text-sm mt-2">Erstellen Sie den ersten Benutzer mit dem Button oben.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benutzer.map((user) => (
                <Card
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold flex-shrink-0">
                        {user.initialen}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-foreground truncate">
                            {user.name}
                          </h3>
                          <Badge variant="outline" className="flex-shrink-0">{ROLE_LABELS[user.rolle]}</Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-muted-foreground truncate">
                          {user.email && (
                            <span>{user.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {currentUser?.id !== user.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

