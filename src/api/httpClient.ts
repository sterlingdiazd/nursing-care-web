import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }

  export interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}
