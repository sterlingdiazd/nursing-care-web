import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface FilterState {
  searchText: string;
  selectedId: string | null;
  view?: string;
  sort?: string;
  [key: string]: string | null | undefined;
}

export interface UseAdminTableFiltersOptions<T extends FilterState> {
  defaultView?: string;
  defaultSort?: string;
  availableViews?: string[];
  availableSorts?: string[];
  path: string;
}

export function useAdminTableFilters<T extends FilterState>(
  options: UseAdminTableFiltersOptions<T>,
) {
  const navigate = useNavigate();
  const location = useLocation();

  const filters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const state: any = {
      searchText: params.get("search") ?? "",
      selectedId: params.get("selected"),
      view: params.get("view") ?? options.defaultView ?? "all",
      sort: params.get("sort") ?? options.defaultSort ?? "newest",
    };

    // Include other params
    params.forEach((value, key) => {
      if (!["search", "selected", "view", "sort"].includes(key)) {
        state[key] = value;
      }
    });

    // Validate view/sort if options provided
    if (options.availableViews && !options.availableViews.includes(state.view)) {
      state.view = options.defaultView ?? "all";
    }
    if (options.availableSorts && !options.availableSorts.includes(state.sort)) {
      state.sort = options.defaultSort ?? "newest";
    }

    return state as T;
  }, [location.search, options]);

  const createQueryString = useCallback((next: Partial<T>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...next };

    if (merged.view && merged.view !== "all") {
      params.set("view", merged.view);
    }
    if (merged.sort && merged.sort !== (options.defaultSort ?? "newest")) {
      params.set("sort", merged.sort);
    }
    if (merged.searchText?.trim()) {
      params.set("search", merged.searchText.trim());
    }
    if (merged.selectedId) {
      params.set("selected", merged.selectedId);
    }

    // Map other keys
    Object.entries(merged).forEach(([key, value]) => {
      if (!["view", "sort", "searchText", "selectedId"].includes(key) && value) {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return query.length > 0 ? `?${query}` : "";
  }, [filters, options.defaultSort]);

  const navigateWithFilters = useCallback((next: Partial<T>) => {
    const query = createQueryString(next);
    navigate(`${options.path}${query}`);
  }, [navigate, createQueryString, options.path]);

  const clearFilters = useCallback(() => {
    navigate(options.path);
  }, [navigate, options.path]);

  return {
    filters,
    navigateWithFilters,
    createQueryString,
    clearFilters,
  };
}
