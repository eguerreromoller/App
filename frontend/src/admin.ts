import { storage } from "./utils/storage";
import { API_BASE, Workshop } from "./api";

const TOKEN_KEY = "va_admin_token";

export async function getToken(): Promise<string | null> {
  return storage.secureGet<string>(TOKEN_KEY, "");
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error("Correo o contraseña incorrectos");
  const data = (await res.json()) as { access_token: string; email: string };
  await storage.secureSet<string>(TOKEN_KEY, data.access_token);
  return data.access_token;
}

export async function adminLogout(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      await adminLogout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export type WorkshopPayload = {
  name: string;
  category: string;
  categories: string[];
  description: string;
  address: string;
  comuna: string;
  region?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  lat?: number | null;
  lng?: number | null;
  image_url: string;
  services: string[];
  hours: Record<string, string>;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    await adminLogout();
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }
  return res;
}

export async function createWorkshop(payload: WorkshopPayload): Promise<Workshop> {
  const res = await authFetch("/workshops", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateWorkshop(id: string, payload: WorkshopPayload): Promise<Workshop> {
  const res = await authFetch(`/workshops/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteWorkshop(id: string): Promise<void> {
  const res = await authFetch(`/workshops/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export type ImportResult = {
  dry_run: boolean;
  to_insert: number;
  duplicates: number;
  unmapped: number;
  invalid: number;
  inserted: number;
  sample: { name: string; comuna: string; categories: string[] }[];
};

export async function importWorkshopsCsv(csvText: string, dryRun: boolean): Promise<ImportResult> {
  const res = await authFetch("/workshops/import", {
    method: "POST",
    body: JSON.stringify({ csv_text: csvText, dry_run: dryRun }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
