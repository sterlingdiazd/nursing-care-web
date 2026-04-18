import { useCallback, useEffect, useState } from "react";
import { getAvailableNurses, type AvailableNurse } from "../api/catalogOptions";
import { logClientEvent } from "../logging/clientLogger";

let cached: AvailableNurse[] | null = null;
let inflight: Promise<AvailableNurse[]> | null = null;

export function prefetchAvailableNurses() {
  if (!inflight) {
    inflight = getAvailableNurses().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function useAvailableNurses() {
  const [data, setData] = useState<AvailableNurse[] | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await getAvailableNurses();
      logClientEvent("useAvailableNurses", "Nurses loaded", { count: next.length });
      cached = next;
      setData(next);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "No fue posible cargar la lista de enfermeras.";
      logClientEvent("useAvailableNurses", "Error loading nurses", { error: errorMessage }, "error");
      setError(errorMessage);
      // Clear cache on error so next call will retry
      cached = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch on mount to ensure we have fresh data (especially after login)
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
