"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderPlus, Box, Shield, ListChecks, ClipboardList, Users } from "lucide-react";
import { ProjektVerwaltung } from "@/components/verwaltung/ProjektVerwaltung";
import { KomponentenVerwaltung } from "@/components/verwaltung/KomponentenVerwaltung";
import { AufgabenVerwaltung } from "@/components/verwaltung/AufgabenVerwaltung";
import { ChecklistenVerwaltung } from "@/components/verwaltung/ChecklistenVerwaltung";
import { BenutzerVerwaltung } from "@/components/verwaltung/BenutzerVerwaltung";
import { useMe } from "@/lib/hooks";
import { useRouter } from "next/navigation";

export default function VerwaltungPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useMe();

  useEffect(() => {
    if (currentUser && currentUser.rolle !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  // Wenn kein Admin, zeige nichts
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Lade...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.rolle !== "admin") {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-4 lg:space-y-4 xl:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 md:h-7 md:w-7 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground">
              Verwaltung
            </h1>
            <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1">
              Projekte, Komponenten, Aufgaben, Checklisten und Benutzer verwalten
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projekte" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="projekte" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Projekte
            </TabsTrigger>
            <TabsTrigger value="komponenten" className="gap-2">
              <Box className="h-4 w-4" />
              Komponenten
            </TabsTrigger>
            <TabsTrigger value="aufgaben" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Aufgaben
            </TabsTrigger>
            <TabsTrigger value="checklisten" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Checklisten
            </TabsTrigger>
            <TabsTrigger value="benutzer" className="gap-2">
              <Users className="h-4 w-4" />
              Benutzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projekte" className="mt-6">
            <ProjektVerwaltung />
          </TabsContent>

          <TabsContent value="komponenten" className="mt-6">
            <KomponentenVerwaltung />
          </TabsContent>

          <TabsContent value="aufgaben" className="mt-6">
            <AufgabenVerwaltung />
          </TabsContent>

          <TabsContent value="checklisten" className="mt-6">
            <ChecklistenVerwaltung />
          </TabsContent>

          <TabsContent value="benutzer" className="mt-6">
            <BenutzerVerwaltung />
          </TabsContent>
        </Tabs>
      </div>
  );
}

