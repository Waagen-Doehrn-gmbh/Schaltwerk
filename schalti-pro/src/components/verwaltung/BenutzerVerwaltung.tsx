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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { userApi, authApi, type CreateUserData, type UpdateUserData } from "@/lib/api";
import type { User, UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  monteur: "Monteur",
  technische_abnahme: "Technische Abnahme",
  endabnahme: "Endabnahme",
};

export function BenutzerVerwaltung() {
  const [benutzer, setBenutzer] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    name: "",
    initialen: "",
    rolle: "monteur",
  });

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      initialen: "",
      rolle: "monteur",
    });
    setEditingUser(null);
  };

  // Dialog öffnen für neuen Benutzer
  const handleNewUser = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      password: "", // Passwort nicht vorausfüllen
      name: user.name,
      initialen: user.initialen,
      rolle: user.rolle,
    });
    setIsDialogOpen(true);
  };

  // Lade Benutzer vom Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [usersData, userData] = await Promise.all([
          userApi.getAll(),
          authApi.getMe().catch(() => null),
        ]);
        setBenutzer(usersData);
        setCurrentUser(userData as User | null);
      } catch (err: any) {
        console.error("Error loading users:", err);
        setError(err.message || "Fehler beim Laden der Benutzer");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Benutzer speichern (erstellen oder aktualisieren)
  const handleSave = async () => {
    try {
      setError(null);

      if (editingUser) {
        // Aktualisiere bestehenden Benutzer
        const updateData: UpdateUserData = {
          email: formData.email,
          name: formData.name,
          initialen: formData.initialen,
          rolle: formData.rolle,
        };
        
        // Nur Passwort hinzufügen, wenn es eingegeben wurde
        if (formData.password && formData.password.length > 0) {
          updateData.password = formData.password;
        }

        await userApi.update(editingUser.id, updateData);
      } else {
        // Erstelle neuen Benutzer
        if (!formData.password || formData.password.length < 6) {
          setError("Passwort muss mindestens 6 Zeichen lang sein");
          return;
        }
        await userApi.create(formData);
      }

      // Lade Benutzer neu
      const usersData = await userApi.getAll();
      setBenutzer(usersData);
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err.message || "Fehler beim Speichern des Benutzers");
    }
  };

  // Benutzer löschen
  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich löschen?")) {
      return;
    }

    try {
      setError(null);
      await userApi.delete(id);
      
      // Lade Benutzer neu
      const usersData = await userApi.getAll();
      setBenutzer(usersData);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message || "Fehler beim Löschen des Benutzers");
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="benutzer@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Passwort {editingUser ? "(optional)" : "*"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingUser ? "Leer lassen zum Beibehalten" : "Mindestens 6 Zeichen"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialen">Initialen *</Label>
                  <Input
                    id="initialen"
                    value={formData.initialen}
                    onChange={(e) =>
                      setFormData({ ...formData, initialen: e.target.value.toUpperCase() })
                    }
                    placeholder="MM"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rolle">Rolle *</Label>
                <Select
                  value={formData.rolle}
                  onValueChange={(value: UserRole) =>
                    setFormData({ ...formData, rolle: value })
                  }
                >
                  <SelectTrigger id="rolle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="monteur">Monteur</SelectItem>
                    <SelectItem value="technische_abnahme">Technische Abnahme</SelectItem>
                    <SelectItem value="endabnahme">Endabnahme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editingUser ? "Aktualisieren" : "Erstellen"}
              </Button>
            </DialogFooter>
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
            <div className="space-y-2">
              {benutzer.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                      {user.initialen}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-foreground">
                          {user.name}
                        </h3>
                        <Badge variant="outline">{ROLE_LABELS[user.rolle]}</Badge>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-muted-foreground mt-1">
                        {user.email && (
                          <span>{user.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

