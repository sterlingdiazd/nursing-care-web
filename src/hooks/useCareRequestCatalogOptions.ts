import { useCallback, useEffect, useState } from "react";
import { getCareRequestOptions } from "../api/catalogOptions";
import type { CatalogOptionsResponse } from "../types/catalog";

let cached: CatalogOptionsResponse | null = null;
let inflight: Promise<CatalogOptionsResponse> | null = null;

export function prefetchCareRequestCatalogOptions() {
  if (!inflight) {
    inflight = getCareRequestOptions().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function useCareRequestCatalogOptions() {
  const [data, setData] = useState<CatalogOptionsResponse | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await getCareRequestOptions();
      cached = next;
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible cargar el catalogo.");
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
