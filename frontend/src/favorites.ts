import { storage } from "./utils/storage";

const KEY = "va_favorites_v1";

export async function getFavorites(): Promise<string[]> {
  const v = await storage.getItem<string>(KEY, "");
  if (!v) return [];
  try {
    return JSON.parse(v) as string[];
  } catch {
    return [];
  }
}

export async function toggleFavorite(id: string): Promise<string[]> {
  const list = await getFavorites();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  await storage.setItem<string>(KEY, JSON.stringify(next));
  return next;
}
