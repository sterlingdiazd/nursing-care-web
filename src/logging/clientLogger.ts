import { useSyncExternalStore } from "react";

export interface ClientLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "error";
  source: string;
  message: string;
  data?: unknown;
}

const STORAGE_KEY = "nursing-care-web-logs";
const MAX_ENTRIES = 100;
const listeners = new Set<() => void>();

let entries: ClientLogEntry[] = loadEntries();

function loadEntries(): ClientLogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function persistEntries() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function emit() {
  persistEntries();
  listeners.forEach((listener) => listener());
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => {
      if (key.toLowerCase().includes("authorization") || key.toLowerCase().includes("token")) {
        return [key, "[REDACTED]"];
      }

      if (key.toLowerCase().includes("password")) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeData(value)];
    }),
  );
}

export function logClientEvent(
  source: string,
  message: string,
  data?: unknown,
  level: "info" | "error" = "info",
) {
  const entry: ClientLogEntry = {
    id: createId(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    data: sanitizeData(data),
  };

  entries = [entry, ...entries].slice(0, MAX_ENTRIES);

  const logMethod = level === "error" ? console.error : console.info;
  logMethod(`[${source}] ${message}`, entry.data ?? "");

  emit();
}

export function clearClientLogs() {
  entries = [];
  emit();
}

export function createCorrelationId() {
  return createId();
}

export function useClientLogs() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entries,
    () => entries,
  );
}
