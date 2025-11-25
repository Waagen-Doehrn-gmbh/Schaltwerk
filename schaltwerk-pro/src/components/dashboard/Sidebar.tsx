"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, FolderOpen, FileText, Settings, Zap, BarChart3, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { useSidebar } from "./SidebarContext";
import type { User } from "@/types";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Projekte", href: "/projekte", icon: FolderOpen },
  { name: "Protokolle", href: "/protokolle", icon: FileText },
  { name: "Analyse", href: "/analyse", icon: BarChart3 },
  { name: "Einstellungen", href: "/einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { isOpen, close } = useSidebar();

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

  const isAdmin = currentUser?.rolle === "admin";
  
  // Prüfe ob Benutzer mindestens die Rolle "analyse" hat
  const kannAnalyse = (rolle?: string): boolean => {
    return rolle === "admin" || rolle === "analyse";
  };
  const hatAnalyseZugriff = kannAnalyse(currentUser?.rolle);

  // Filtere Navigation basierend auf Berechtigungen
  const navigationItems = navigation
    .filter((item) => {
      // Analyse-Tab nur für Benutzer mit mindestens "analyse" Rolle
      if (item.name === "Analyse") {
        return hatAnalyseZugriff;
      }
      return true;
    })
    .concat(isAdmin ? [{ name: "Verwaltung", href: "/verwaltung", icon: Shield }] : []);

  return (
    <>
      {/* Overlay für mobile Geräte und Tablets */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen w-[220px] md:w-[220px] lg:w-[220px] xl:w-[260px] bg-slate-900 dark:bg-sidebar border-r border-slate-800 dark:border-sidebar-border flex flex-col z-50 transition-transform duration-300 ease-in-out",
          // Auf mobilen Geräten und Tablets (< 1024px): Versteckt standardmäßig, sichtbar wenn isOpen
          "transform -translate-x-full lg:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        {/* Header mit Close-Button für mobile */}
        <div className="flex items-center justify-between px-4 md:px-5 lg:px-5 xl:px-6 py-4 border-b border-slate-800 dark:border-sidebar-border">
          <Link
            href="/"
            className="flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-sidebar-accent transition-colors -ml-2 px-2 py-1 rounded"
            onClick={close}
          >
            <Zap className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 xl:h-6 xl:w-6 text-blue-500 flex-shrink-0" />
            <span className="text-white dark:text-sidebar-foreground font-semibold text-base md:text-base lg:text-base xl:text-lg whitespace-nowrap">SchaltWerk</span>
          </Link>
          {/* Close Button nur auf mobilen Geräten und Tablets */}
          <button
            onClick={close}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
            aria-label="Menü schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 md:px-3 lg:px-3 xl:px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-800 dark:bg-sidebar-accent text-white dark:text-sidebar-foreground border-l-4 border-blue-500 dark:border-sidebar-primary"
                  : "text-slate-300 dark:text-sidebar-foreground/70 hover:bg-slate-800 dark:hover:bg-sidebar-accent hover:text-white dark:hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

        {/* Footer */}
        <div className="px-4 md:px-5 lg:px-5 xl:px-6 py-4 border-t border-slate-800 dark:border-sidebar-border">
          <p className="text-xs text-slate-500 dark:text-sidebar-foreground/60">SchaltWerk V1.0. pwrd by Döhrn Soft</p>
        </div>
      </div>
    </>
  );
}

