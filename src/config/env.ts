// Each Vite mode can provide its own API URL through .env.development, .env.staging,
// .env.production, or a local override such as .env.development.local.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
