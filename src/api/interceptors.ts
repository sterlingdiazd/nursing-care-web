import { clearAuthSession, getAuthSession, saveAuthSession } from "../auth/sessionStorage";
import { createCorrelationId, logClientEvent } from "../logging/clientLogger";
import { refreshAuthToken } from "./auth";
import { httpClient } from "./httpClient";

let refreshPromise: Promise<string | null> | null = null;

httpClient.interceptors.request.use(
  (config) => {
    const configuredCorrelationId =
      typeof config.headers?.["X-Correlation-ID"] === "string"
        ? config.headers["X-Correlation-ID"]
        : undefined;
    const correlationId = configuredCorrelationId ?? createCorrelationId();
    const requestUrl = new URL(config.url ?? "", config.baseURL).toString();
    const session = getAuthSession();
    const storedToken = session?.token ?? null;

    config.headers = {
      ...config.headers,
      "X-Correlation-ID": correlationId,
      "X-Client-App": "nursing-care-web",
      "X-Client-Platform": "web",
      ...(storedToken && !config.headers?.Authorization
        ? { Authorization: `Bearer ${storedToken}` }
        : {}),
    };

    logClientEvent("web.http", "Request started", {
      correlationId,
      method: config.method?.toUpperCase(),
      url: requestUrl,
      hasAuthorization: Boolean(config.headers?.Authorization),
    });

    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => {
    logClientEvent("web.http", "Request completed", {
      correlationId: response.headers["x-correlation-id"],
      method: response.config.method?.toUpperCase(),
      url: new URL(response.config.url ?? "", response.config.baseURL).toString(),
      status: response.status,
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const session = getAuthSession();
    const requestPath = originalRequest?.url ?? "";
    const isAuthRoute =
      requestPath.includes("/auth/login") ||
      requestPath.includes("/auth/register") ||
      requestPath.includes("/auth/refresh");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthRoute &&
      session?.refreshToken
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAuthToken(session.refreshToken)
          .then((response) => {
            saveAuthSession({
              token: response.token,
              refreshToken: response.refreshToken,
              expiresAtUtc: response.expiresAtUtc,
              userId: response.userId,
              email: response.email,
              roles: response.roles,
              profileType: session.profileType,
              requiresProfileCompletion: response.requiresProfileCompletion,
              requiresAdminReview: response.requiresAdminReview,
            });

            logClientEvent("web.auth", "Access token refreshed");
            return response.token;
          })
          .catch((refreshError) => {
            clearAuthSession();
            logClientEvent("web.auth", "Refresh token rejected", {}, "error");
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshedToken = await refreshPromise;

      if (refreshedToken) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${refreshedToken}`,
        };

        return httpClient(originalRequest);
      }
    }

    logClientEvent(
      "web.http",
      "Request failed",
      {
        correlationId:
          error.response?.headers?.["x-correlation-id"] ?? error.config?.headers?.["X-Correlation-ID"],
        method: error.config?.method?.toUpperCase(),
        url: error.config ? new URL(error.config.url ?? "", error.config.baseURL).toString() : undefined,
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      },
      "error",
    );

    if (status === 401 && !isAuthRoute) {
      clearAuthSession();
    }

    return Promise.reject(error);
  },
);
