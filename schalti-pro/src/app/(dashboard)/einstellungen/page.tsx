"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Lock, Moon, Sun, CheckCircle2, AlertCircle, User, X, Upload, LogOut } from "lucide-react";
import { authApi } from "@/lib/api";
import { useMe, useUpdateProfile, useChangePassword } from "@/lib/hooks";
import { getAvatarUrl, setAvatarUrl, removeAvatarUrl, getUserName, setUserName, getDisplayName } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const nameSchema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  nachname: z.string().min(1, "Nachname ist erforderlich"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen lang sein"),
  confirmPassword: z.string().min(1, "Bitte bestätigen Sie das neue Passwort"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Die neuen Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type NameFormData = z.infer<typeof nameSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function EinstellungenPage() {
  const { data: currentUser } = useMe();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  
  // Avatar State
  const [avatarUrl, setAvatarUrlState] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Name Form
  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      vorname: "",
      nachname: "",
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Avatar und Namen beim Laden aus localStorage holen
  useEffect(() => {
    if (!currentUser) return;
    const storedAvatar = getAvatarUrl(currentUser.id);
    if (storedAvatar) {
      setAvatarUrlState(storedAvatar);
    }
    
    const storedName = getUserName(currentUser.id);
    if (storedName) {
      nameForm.reset({
        vorname: storedName.vorname,
        nachname: storedName.nachname,
      });
    } else {
      // Fallback: Name aus currentUser.name extrahieren
      const nameParts = currentUser.name.split(" ");
      nameForm.reset({
        vorname: nameParts[0] || "",
        nachname: nameParts.slice(1).join(" ") || "",
      });
    }
  }, [currentUser, nameForm]);

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

  const onNameSubmit = async (data: NameFormData) => {
    if (!currentUser) return;

    try {
      const fullName = `${data.vorname.trim()} ${data.nachname.trim()}`;
      // Extrahiere Initialen aus Vor- und Nachname
      const initialen = (data.vorname.trim()[0] || "") + (data.nachname.trim()[0] || "");
      
      await updateProfileMutation.mutateAsync({
        name: fullName,
        initialen: initialen.length >= 2 ? initialen.toUpperCase() : currentUser.initialen,
      });
      
      // Aktualisiere auch lokal
      setUserName(currentUser.id, data.vorname.trim(), data.nachname.trim());
    } catch (err: any) {
      nameForm.setError("root", {
        message: err.message || "Fehler beim Speichern der Namen. Bitte versuchen Sie es erneut.",
      });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
    } catch (err: any) {
      passwordForm.setError("root", {
        message: err.message || "Fehler beim Ändern des Passworts. Bitte versuchen Sie es erneut.",
      });
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
                <Form {...nameForm}>
                  <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={nameForm.control}
                        name="vorname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vorname</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="Vorname"
                                disabled={updateProfileMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={nameForm.control}
                        name="nachname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nachname</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="Nachname"
                                disabled={updateProfileMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Fehlermeldung */}
                    {nameForm.formState.errors.root && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-900">
                          {nameForm.formState.errors.root.message}
                        </p>
                      </div>
                    )}

                    {/* Erfolgsmeldung */}
                    {updateProfileMutation.isSuccess && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-900">
                          Name wurde erfolgreich gespeichert.
                        </p>
                      </div>
                    )}

                    <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto">
                      {updateProfileMutation.isPending ? "Wird gespeichert..." : "Name speichern"}
                    </Button>
                  </form>
                </Form>
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
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {/* Aktuelles Passwort */}
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktuelles Passwort</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Neues Passwort */}
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      Mindestens 8 Zeichen
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Passwort bestätigen */}
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        disabled={changePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fehlermeldung */}
              {passwordForm.formState.errors.root && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-900">
                    {passwordForm.formState.errors.root.message}
                  </p>
                </div>
              )}

              {/* Erfolgsmeldung */}
              {changePasswordMutation.isSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900">
                    Passwort wurde erfolgreich geändert.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full">
                {changePasswordMutation.isPending ? "Wird gespeichert..." : "Passwort ändern"}
              </Button>
            </form>
          </Form>
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

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Abmelden
          </CardTitle>
          <CardDescription>
            Melden Sie sich von Ihrem Konto ab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await authApi.logout();
                // Redirect to login page
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              } catch (error: any) {
                console.error("Logout error:", error);
                // Even if logout fails, redirect to login
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              }
            }}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

