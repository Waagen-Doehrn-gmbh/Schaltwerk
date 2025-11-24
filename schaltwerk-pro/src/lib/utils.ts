import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { ProjektStatus, KomponentenStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return format(date, "dd.MM.yyyy • HH:mm", { locale: de })
}

export function formatStunden(hours: number): string {
  return `${hours.toFixed(1).replace(".", ",")} Std`
}

export function getStatusColor(status: ProjektStatus | KomponentenStatus): string {
  switch (status) {
    case "abgeschlossen":
      return "bg-green-100 text-green-800 border-green-200"
    case "in_bearbeitung":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "planung":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "ausstehend":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function getStatusBadge(status: ProjektStatus | KomponentenStatus) {
  const colors = getStatusColor(status)
  let label = ""
  
  switch (status) {
    case "abgeschlossen":
      label = "Abgeschlossen"
      break
    case "in_bearbeitung":
      label = "In Bearbeitung"
      break
    case "planung":
      label = "Planung"
      break
    case "ausstehend":
      label = "Ausstehend"
      break
  }
  
  return {
    label,
    className: colors,
  }
}

// Avatar-Utilities
export function getAvatarUrl(userId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = localStorage.getItem(`avatar_${userId}`);
  return stored || undefined;
}

export function setAvatarUrl(userId: string, avatarUrl: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`avatar_${userId}`, avatarUrl);
}

export function removeAvatarUrl(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`avatar_${userId}`);
}

// Name-Utilities
export function getUserName(userId: string): { vorname: string; nachname: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`name_${userId}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setUserName(userId: string, vorname: string, nachname: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`name_${userId}`, JSON.stringify({ vorname, nachname }));
}

export function removeUserName(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`name_${userId}`);
}

// Helper: Gibt den vollständigen Namen zurück (aus localStorage oder Fallback)
export function getDisplayName(userId: string, fallbackName: string): string {
  const storedName = getUserName(userId);
  if (storedName) {
    return `${storedName.vorname} ${storedName.nachname}`.trim();
  }
  return fallbackName;
}
