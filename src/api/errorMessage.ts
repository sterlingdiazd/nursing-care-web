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

function getStatusBasedFallback(status: number | undefined, fallback: string) {
  if (status === 401) {
    return "Correo o contrasena invalidos. Verifica tus datos e intenta de nuevo.";
  }

  if (status === 403) {
    return "Tu cuenta no tiene permisos para acceder en este momento.";
  }

  if (status === 429) {
    return "Has excedido temporalmente los intentos permitidos. Intenta de nuevo en unos minutos.";
  }

  if (status && status >= 500) {
    return "Ocurrio un problema en el servidor. Intenta de nuevo en unos minutos.";
  }

  return fallback;
}

export function extractApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const payload = typeof error.response?.data === "string"
      ? undefined
      : (error.response?.data as ProblemDetailsLike | undefined);
    const statusFallback = getStatusBasedFallback(error.response?.status, fallback);

    // Check if it's a network error
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 8080.';
    }

    return (
      payload?.detail ||
      getFirstValidationError(payload) ||
      payload?.error ||
      payload?.message ||
      payload?.title ||
      (typeof error.response?.data === "string" ? error.response.data : "") ||
      statusFallback
    );
  }

  if (error instanceof Error) {
    // Check for network-related error messages
    if (error.message && error.message.includes('Failed to fetch')) {
      return 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 8080.';
    }
    return error.message || fallback;
  }

  return fallback;
}
