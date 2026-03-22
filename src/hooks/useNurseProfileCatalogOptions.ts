import { useCallback, useEffect, useState } from "react";
import { getNurseProfileOptions } from "../api/catalogOptions";
import type { NurseProfileOptionsResponse } from "../types/catalog";

let cached: NurseProfileOptionsResponse | null = null;

export function useNurseProfileCatalogOptions() {
  const [data, setData] = useState<NurseProfileOptionsResponse | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await getNurseProfileOptions();
      cached = next;
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible cargar las opciones de enfermeria.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
