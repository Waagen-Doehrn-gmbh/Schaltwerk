// API Client für Backend-Kommunikation

import type { User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";

// API Request Helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Send cookies with every request
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token ungültig, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const error = await response.json().catch(() => ({ error: "Unbekannter Fehler" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Bei 204 No Content gibt es keinen Body
  if (response.status === 204) {
    return null as T;
  }

  // Prüfe Content-Length für leere Antworten
  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return null as T;
  }

  // Versuche JSON zu parsen, handle leere Antworten
  const text = await response.text();
  if (!text || text.trim() === "") {
    return null as T;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // Falls kein JSON, gib null zurück
    return null as T;
  }
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiRequest<{ user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return response;
  },

  register: async (data: { email: string; password: string; name: string }) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return apiRequest("/api/auth/logout", {
      method: "POST",
    });
  },

  getMe: async () => {
    return apiRequest("/api/auth/me");
  },

  updateProfile: async (data: { name?: string; initialen?: string; avatarUrl?: string }) => {
    return apiRequest("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Projekt API
export const projektApi = {
  getAll: async () => {
    return apiRequest<any[]>("/api/projekte");
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/api/projekte/${id}`);
  },

  create: async (data: any) => {
    return apiRequest("/api/projekte", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/api/projekte/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/projekte/${id}`, {
      method: "DELETE",
    });
  },
};

// Protokoll API
export const protokollApi = {
  getAll: async () => {
    return apiRequest<any[]>("/api/protokolle");
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/api/protokolle/${id}`);
  },

  getByProjekt: async (projektId: string) => {
    return apiRequest<any[]>(`/api/protokolle/projekt/${projektId}`);
  },

  create: async (data: any) => {
    return apiRequest("/api/protokolle", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/api/protokolle/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/protokolle/${id}`, {
      method: "DELETE",
    });
  },
};

// Komponente API
export const komponenteApi = {
  getAll: async () => {
    return apiRequest<any[]>("/api/komponenten");
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/api/komponenten/${id}`);
  },

  getByProjekt: async (projektId: string) => {
    return apiRequest<any[]>(`/api/komponenten/projekt/${projektId}`);
  },

  create: async (data: any) => {
    return apiRequest("/api/komponenten", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/api/komponenten/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/komponenten/${id}`, {
      method: "DELETE",
    });
  },
};

// Aufgaben API
export interface Aufgabe {
  id: string;
  name: string;
  checklisteId?: string;
}

export const aufgabeApi = {
  getAll: async (): Promise<Aufgabe[]> => {
    return apiRequest<Aufgabe[]>("/api/aufgaben");
  },
  getById: async (id: string): Promise<Aufgabe> => {
    return apiRequest<Aufgabe>(`/api/aufgaben/${id}`);
  },
  create: async (aufgabeData: Omit<Aufgabe, "id">): Promise<Aufgabe> => {
    return apiRequest<Aufgabe>("/api/aufgaben", {
      method: "POST",
      body: JSON.stringify(aufgabeData),
    });
  },
  update: async (id: string, aufgabeData: Partial<Aufgabe>): Promise<Aufgabe> => {
    return apiRequest<Aufgabe>(`/api/aufgaben/${id}`, {
      method: "PUT",
      body: JSON.stringify(aufgabeData),
    });
  },
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/aufgaben/${id}`, {
      method: "DELETE",
    });
  },
};

// Checklisten API
export interface ChecklisteItem {
  id: string;
  text: string;
}

export interface Checkliste {
  id: string;
  name: string;
  typ: "technisch" | "endabnahme" | "allgemein";
  items: ChecklisteItem[];
}

export const checklisteApi = {
  getAll: async (typ?: "technisch" | "endabnahme" | "allgemein"): Promise<Checkliste[]> => {
    const url = typ ? `/api/checklisten?typ=${typ}` : "/api/checklisten";
    return apiRequest<Checkliste[]>(url);
  },
  getById: async (id: string): Promise<Checkliste> => {
    return apiRequest<Checkliste>(`/api/checklisten/${id}`);
  },
  create: async (checklisteData: Omit<Checkliste, "id">): Promise<Checkliste> => {
    return apiRequest<Checkliste>("/api/checklisten", {
      method: "POST",
      body: JSON.stringify(checklisteData),
    });
  },
  update: async (id: string, checklisteData: Partial<Checkliste>): Promise<Checkliste> => {
    return apiRequest<Checkliste>(`/api/checklisten/${id}`, {
      method: "PUT",
      body: JSON.stringify(checklisteData),
    });
  },
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/checklisten/${id}`, {
      method: "DELETE",
    });
  },
};

// User API
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  initialen: string;
  rolle: "admin" | "monteur" | "technische_abnahme" | "endabnahme";
  berechtigungen?: string[];
  avatarUrl?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  password?: string;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    return apiRequest<User[]>("/api/users");
  },
  getById: async (id: string): Promise<User> => {
    return apiRequest<User>(`/api/users/${id}`);
  },
  create: async (userData: CreateUserData): Promise<User> => {
    return apiRequest<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  update: async (id: string, userData: UpdateUserData): Promise<User> => {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/api/users/${id}`, {
      method: "DELETE",
    });
  },
};

// Chat API
export const chatApi = {
  getByProjekt: async (projektId: string) => {
    return apiRequest<any[]>(`/api/chat/projekt/${projektId}`);
  },
  create: async (data: { text: string; projektId: string; imageUrl?: string }) => {
    return apiRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

