// Zentrale Utility-Funktionen für Fallback-Checklisten

// Helper: Lade gelöschte Fallback-Checklisten aus localStorage
export function getDeletedFallbackChecklisten(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const deleted = localStorage.getItem("deletedFallbackChecklisten");
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
}

// Helper: Speichere gelöschte Fallback-Checkliste in localStorage
export function markFallbackChecklisteAsDeleted(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const deleted = getDeletedFallbackChecklisten();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem("deletedFallbackChecklisten", JSON.stringify(deleted));
    }
  } catch (error) {
    console.error("Fehler beim Speichern gelöschter Fallback-Checklisten:", error);
  }
}

// Helper: Filtere gelöschte Fallback-Checklisten aus einer Liste
export function filterDeletedFallbackChecklisten<T extends { id: string }>(
  checklisten: T[]
): T[] {
  const deletedIds = getDeletedFallbackChecklisten();
  return checklisten.filter((checkliste) => !deletedIds.includes(checkliste.id));
}

