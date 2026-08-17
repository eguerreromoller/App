import Constants from "expo-constants";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ||
  (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_BACKEND_URL || "";

export const API_BASE = `${BASE}/api`;

export type Workshop = {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  comuna: string;
  region: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  lat?: number | null;
  lng?: number | null;
  image_url: string;
  services: string[];
  hours: Record<string, string>;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
};

export type Category = {
  key: string;
  name: string;
  icon: string;
  image_url: string;
  description: string;
};

async function req<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  categories: () => req<Category[]>("/categories"),
  comunas: () => req<string[]>("/comunas"),
  featured: () => req<Workshop[]>("/workshops/featured"),
  workshops: (params: { search?: string; category?: string; comuna?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.comuna) qs.set("comuna", params.comuna);
    const q = qs.toString();
    return req<Workshop[]>(`/workshops${q ? `?${q}` : ""}`);
  },
  workshop: (id: string) => req<Workshop>(`/workshops/${id}`),
  chat: async (session_id: string, message: string) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, message }),
    });
    if (!res.ok) throw new Error(`chat ${res.status}`);
    return res.json() as Promise<{ reply: string; recommendations: Workshop[] }>;
  },
};
