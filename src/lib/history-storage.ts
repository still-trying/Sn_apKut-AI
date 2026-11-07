export interface CutoutHistoryItem {
  id: string;
  name: string;
  size: number;
  resultUrl: string;
  createdAt: number;
  rawResponse?: Record<string, unknown> | undefined;
}

const STORAGE_KEY = "snapkut_cutout_history_v1";
const EVENT_NAME = "snapkut_history_updated";

export function getStoredHistory(): CutoutHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CutoutHistoryItem =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as CutoutHistoryItem).id === "string" &&
        typeof (item as CutoutHistoryItem).resultUrl === "string",
    );
  } catch (err) {
    console.error("Failed to load history from localStorage:", err);
    return [];
  }
}

export function saveHistoryItem(
  item: Omit<CutoutHistoryItem, "id" | "createdAt">,
): CutoutHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const current = getStoredHistory();
    // Avoid duplicate resultUrls in history
    const filtered = current.filter((existing) => existing.resultUrl !== item.resultUrl);
    const newItem: CutoutHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    // Keep up to 50 most recent items
    const updated = [newItem, ...filtered].slice(0, 50);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save history to localStorage:", err);
    return getStoredHistory();
  }
}

export function deleteHistoryItem(id: string): CutoutHistoryItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const current = getStoredHistory();
    const updated = current.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return getStoredHistory();
  }
}

export function clearAllHistory(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
  } catch (err) {
    console.error("Failed to clear history from localStorage:", err);
  }
}

export { EVENT_NAME };
