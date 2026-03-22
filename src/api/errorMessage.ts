import { isAxiosError } from "axios";

interface ProblemDetailsLike {
  detail?: string;
  error?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[] | undefined>;
}

function getFirstValidationError(payload: ProblemDetailsLike | undefined) {
  if (!payload?.errors) {
    return "";
  }

  return Object.values(payload.errors).flat().find((value) => Boolean(value)) ?? "";
}

export function extractApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const payload = typeof error.response?.data === "string"
      ? undefined
      : (error.response?.data as ProblemDetailsLike | undefined);

    return (
      payload?.detail ||
      getFirstValidationError(payload) ||
      payload?.error ||
      payload?.message ||
      payload?.title ||
      (typeof error.response?.data === "string" ? error.response.data : "") ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
