import { httpClient } from "./httpClient";
import { createCorrelationId, logClientEvent } from "../logging/clientLogger";

httpClient.interceptors.request.use(
  (config) => {
    const correlationId = createCorrelationId();
    const requestUrl = new URL(config.url ?? "", config.baseURL).toString();

    config.headers = {
      ...config.headers,
      "X-Correlation-ID": correlationId,
      "X-Client-App": "nursing-care-web",
      "X-Client-Platform": "web",
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
  (error) => {
    logClientEvent(
      "web.http",
      "Request failed",
      {
        correlationId: error.response?.headers?.["x-correlation-id"] ?? error.config?.headers?.["X-Correlation-ID"],
        method: error.config?.method?.toUpperCase(),
        url: error.config ? new URL(error.config.url ?? "", error.config.baseURL).toString() : undefined,
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      },
      "error",
    );

    return Promise.reject(error);
  },
);
