import { AxiosHeaders } from "axios";
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
    const requestUrl = config.baseURL
      ? `${config.baseURL.replace(/\/$/, "")}/${(config.url ?? "").replace(/^\//, "")}`
      : config.url ?? "";
    const session = getAuthSession();
    const storedToken = session?.token ?? null;
    const headers = AxiosHeaders.from(config.headers);

    headers.set("X-Correlation-ID", correlationId);
    headers.set("X-Client-App", "nursing-care-web");
    headers.set("X-Client-Platform", "web");

    if (storedToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${storedToken}`);
    }

    config.headers = headers;

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
      url: response.config.baseURL
        ? `${response.config.baseURL.replace(/\/$/, "")}/${(response.config.url ?? "").replace(/^\//, "")}`
        : response.config.url ?? "",
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
        url: error.config
          ? error.config.baseURL
            ? `${error.config.baseURL.replace(/\/$/, "")}/${(error.config.url ?? "").replace(/^\//, "")}`
            : error.config.url ?? ""
          : undefined,
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
