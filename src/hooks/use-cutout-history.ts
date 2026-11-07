import { useState, useEffect, useCallback } from "react";
import {
  CutoutHistoryItem,
  getStoredHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  EVENT_NAME,
} from "@/lib/history-storage";

export function useCutoutHistory() {
  const [history, setHistory] = useState<CutoutHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(getStoredHistory());
    setIsLoaded(true);

    const handleUpdate = () => {
      setHistory(getStoredHistory());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addItem = useCallback((item: Omit<CutoutHistoryItem, "id" | "createdAt">) => {
    const updated = saveHistoryItem(item);
    setHistory(updated);
  }, []);

  const removeItem = useCallback((id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  }, []);

  const clear = useCallback(() => {
    clearAllHistory();
    setHistory([]);
  }, []);

  return {
    history,
    isLoaded,
    addItem,
    removeItem,
    clear,
  };
}

