import { apiClient } from "./client";
import type {
  CurrentUser,
  LoginPayload,
  RegisterManagerPayload,
  TokenResponse,
} from "../types/auth";

export async function loginRequest(payload: LoginPayload): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/api/v1/auth/login", payload);
  return response.data;
}

export async function registerManagerRequest(
  payload: RegisterManagerPayload
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/api/v1/auth/register-manager",
    payload
  );
  return response.data;
}

export async function getMeRequest(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>("/api/v1/auth/me");
  return response.data;
}
