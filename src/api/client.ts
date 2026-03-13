import axios from "axios";
import { getAccessToken } from "../utils/storage";

const DEFAULT_API_BASE_URL =
  "https://arsva-api-e7ekamhrhpdfadeu.canadacentral-01.azurewebsites.net";

const resolvedApiBaseUrl =
  String(import.meta.env.VITE_API_BASE_URL ?? "").trim() || DEFAULT_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
