"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home, Moon, Sun, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { cn, getAvatarUrl, getDisplayName } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useProjekt } from "@/lib/hooks";
import { useSidebar } from "./SidebarContext";
import type { User } from "@/types";

function getBreadcrumbs(pathname: string, projektSchaltschrankNummer?: string): { label: string; href: string }[] {
  // If we're on the root dashboard, just return Dashboard
  if (pathname === "/") {
    return [{ label: "Dashboard", href: "/" }];
  }

  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/" },
  ];

  if (paths.length === 0) return breadcrumbs;

  const labels: Record<string, string> = {
    projekte: "Projekte",
    protokolle: "Protokolle",
    komponenten: "Komponenten",
    einstellungen: "Einstellungen",
    verwaltung: "Verwaltung",
    analyse: "Analyse",
  };

  let currentPath = "";
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    let label = labels[path] || path;
    
    // Wenn es ein Projekt-Detail ist (projekte/[id]), zeige Schaltschranknummer
    if (path === "projekte" && index === paths.length - 2 && paths[index + 1]) {
      // Nächster Pfad ist die ID/Schaltschranknummer
      label = "Projekte";
    } else if (index === paths.length - 1 && paths[index - 1] === "projekte") {
      // Letzter Pfad nach "projekte" - zeige Schaltschranknummer oder ID
      label = projektSchaltschrankNummer || path;
    }
    
    breadcrumbs.push({
      label: index === paths.length - 1 ? label : label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}

export function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toggle: toggleSidebar } = useSidebar();
  
  // Extrahiere Projekt-ID/Schaltschranknummer aus URL für Breadcrumbs
  const projektMatch = pathname.match(/^\/projekte\/(.+)$/);
  const projektIdentifier = projektMatch ? projektMatch[1] : undefined;
  const { data: projekt } = useProjekt(projektIdentifier);
  
  const breadcrumbs = getBreadcrumbs(pathname, projekt?.schaltschrankNummer);

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

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-background border-b border-slate-200 dark:border-border px-4 md:px-4 lg:px-4 xl:px-6 py-3 md:py-3 lg:py-3 xl:py-4 flex items-center justify-between">
      {/* Burger Menu Button für mobile und Tablet */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden h-8 w-8 text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted mr-2"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 md:gap-2 text-xs md:text-xs lg:text-xs xl:text-sm min-w-0 flex-1">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1 md:gap-2 min-w-0">
            {index > 0 && <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-slate-400 dark:text-muted-foreground flex-shrink-0" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-slate-900 dark:text-foreground font-medium truncate">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground transition-colors flex items-center flex-shrink-0"
              >
                {crumb.href === "/" ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <span className="hidden md:inline">{crumb.label}</span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right Side: Theme Toggle + User Info */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 md:h-9 md:w-9 text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
          aria-label={theme === "dark" ? "Light Mode aktivieren" : "Dark Mode aktivieren"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Moon className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>

        {/* User Info */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 md:h-8 md:w-8 lg:h-8 lg:w-8 xl:h-10 xl:w-10">
              {getAvatarUrl(currentUser.id) && (
                <AvatarImage 
                  src={getAvatarUrl(currentUser.id)!} 
                  alt={getDisplayName(currentUser.id, currentUser.name)} 
                />
              )}
              <AvatarFallback className="bg-blue-500 text-white text-xs">
                {currentUser.initialen}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs md:text-xs lg:text-xs xl:text-sm font-medium text-slate-900 dark:text-foreground hidden md:inline">
              {getDisplayName(currentUser.id, currentUser.name)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

