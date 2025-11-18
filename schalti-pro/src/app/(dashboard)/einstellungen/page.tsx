"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Lock, Moon, Sun, CheckCircle2, AlertCircle, User, X, Upload } from "lucide-react";
import { authApi } from "@/lib/api";
import { getAvatarUrl, setAvatarUrl, removeAvatarUrl, getUserName, setUserName, getDisplayName } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { User } from "@/types";

export default function EinstellungenPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Avatar State
  const [avatarUrl, setAvatarUrlState] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Name State
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Benutzer beim Laden holen
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authApi.getMe() as User;
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Avatar und Namen beim Laden aus localStorage holen
  useEffect(() => {
    if (!currentUser) return;
    const storedAvatar = getAvatarUrl(currentUser.id);
    if (storedAvatar) {
      setAvatarUrlState(storedAvatar);
    }
    
    const storedName = getUserName(currentUser.id);
    if (storedName) {
      setVorname(storedName.vorname);
      setNachname(storedName.nachname);
    } else {
      // Fallback: Name aus currentUser.name extrahieren
      const nameParts = currentUser.name.split(" ");
      setVorname(nameParts[0] || "");
      setNachname(nameParts.slice(1).join(" ") || "");
    }
  }, [currentUser]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung: Nur Bilder
    if (!file.type.startsWith("image/")) {
      setAvatarError("Bitte wählen Sie eine Bilddatei aus.");
      return;
    }

    // Validierung: Max. 2MB
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Das Bild darf maximal 2MB groß sein.");
      return;
    }

    setAvatarError("");
    setAvatarSuccess(false);

    // Bild als Data URL lesen
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setAvatarUrlState(imageUrl);
      setAvatarUrl(currentUser.id, imageUrl);
      setAvatarSuccess(true);
      
      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => {
        setAvatarSuccess(false);
      }, 3000);
    };
    reader.onerror = () => {
      setAvatarError("Fehler beim Lesen der Datei. Bitte versuchen Sie es erneut.");
    };
    reader.readAsDataURL(file);

    // Input zurücksetzen
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    if (!currentUser) return;
    setAvatarUrlState(undefined);
    removeAvatarUrl(currentUser.id);
    setAvatarSuccess(true);
    setTimeout(() => {
      setAvatarSuccess(false);
    }, 3000);
  };

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setNameError("");
    setNameSuccess(false);

    // Validierung
    if (!vorname.trim() || !nachname.trim()) {
      setNameError("Bitte füllen Sie Vor- und Nachname aus.");
      return;
    }

    setIsSavingName(true);

    try {
      const fullName = `${vorname.trim()} ${nachname.trim()}`;
      // Extrahiere Initialen aus Vor- und Nachname
      const initialen = (vorname.trim()[0] || "") + (nachname.trim()[0] || "");
      
      await authApi.updateProfile({
        name: fullName,
        initialen: initialen.length >= 2 ? initialen.toUpperCase() : currentUser.initialen,
      });
      
      // Aktualisiere auch lokal
      setUserName(currentUser.id, vorname.trim(), nachname.trim());
      
      // Aktualisiere currentUser State
      setCurrentUser({
        ...currentUser,
        name: fullName,
        initialen: initialen.length >= 2 ? initialen.toUpperCase() : currentUser.initialen,
      });
      
      setNameSuccess(true);
      
      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => {
        setNameSuccess(false);
      }, 3000);
    } catch (err) {
      setNameError("Fehler beim Speichern der Namen. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validierung
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Bitte füllen Sie alle Felder aus.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (err) {
      setPasswordError("Fehler beim Ändern des Passworts. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Lade Benutzerdaten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-600 dark:text-muted-foreground" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-foreground">Einstellungen</h1>
      </div>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihr Profilbild und Ihre persönlichen Informationen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Name ändern */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground mb-3">Name</h3>
                <form onSubmit={handleNameChange} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vorname">Vorname</Label>
                      <Input
                        id="vorname"
                        type="text"
                        placeholder="Vorname"
                        value={vorname}
                        onChange={(e) => setVorname(e.target.value)}
                        disabled={isSavingName}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nachname">Nachname</Label>
                      <Input
                        id="nachname"
                        type="text"
                        placeholder="Nachname"
                        value={nachname}
                        onChange={(e) => setNachname(e.target.value)}
                        disabled={isSavingName}
                        required
                      />
                    </div>
                  </div>

                  {/* Fehlermeldung */}
                  {nameError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-900">{nameError}</p>
                    </div>
                  )}

                  {/* Erfolgsmeldung */}
                  {nameSuccess && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-900">
                        Name wurde erfolgreich gespeichert.
                      </p>
                    </div>
                  )}

                  <Button type="submit" disabled={isSavingName} className="w-full sm:w-auto">
                    {isSavingName ? "Wird gespeichert..." : "Name speichern"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-border" />

            {/* Profilbild */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground mb-3">Profilbild</h3>
                {/* Aktuelles Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-20 w-20 border-2 border-slate-200 dark:border-border">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={getDisplayName(currentUser.id, currentUser.name)} />
                    ) : null}
                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                      {currentUser.initialen}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-foreground mb-1">
                      {getDisplayName(currentUser.id, currentUser.name)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">
                      Das Profilbild wird im Chat und bei abgeschlossenen Aufgaben angezeigt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bild hochladen
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Entfernen
                  </Button>
                )}
              </div>

              {/* Fehlermeldung */}
              {avatarError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-900">{avatarError}</p>
                </div>
              )}

              {/* Erfolgsmeldung */}
              {avatarSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900">
                    Profilbild wurde {avatarUrl ? "aktualisiert" : "entfernt"}.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Empfohlene Größe: 200x200px. Max. Dateigröße: 2MB. Unterstützte Formate: JPG, PNG, GIF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passwort ändern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>
            Ändern Sie Ihr Passwort, um Ihr Konto sicher zu halten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Aktuelles Passwort */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Neues Passwort */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={8}
              />
              <p className="text-xs text-slate-500">
                Mindestens 8 Zeichen
              </p>
            </div>

            {/* Passwort bestätigen */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Fehlermeldung */}
            {passwordError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-900">{passwordError}</p>
              </div>
            )}

            {/* Erfolgsmeldung */}
            {passwordSuccess && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-900">
                  Passwort wurde erfolgreich geändert.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Wird gespeichert..." : "Passwort ändern"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Darkmode Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {darkMode ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            Darstellung
          </CardTitle>
          <CardDescription>
            Passen Sie das Erscheinungsbild der Anwendung an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="darkmode" className="text-base">
                Dark Mode
              </Label>
              <p className="text-sm text-slate-500 dark:text-muted-foreground">
                Aktivieren Sie den Dark Mode für eine dunkle Ansicht.
              </p>
            </div>
            <Switch
              id="darkmode"
              checked={darkMode}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

