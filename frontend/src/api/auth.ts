import { apiRequest } from "./client";

export interface User {
  id: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export function register(payload: AuthPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: AuthPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/me");
}
