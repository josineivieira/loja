import { api } from "./api";
import type { LoginPayload, RegisterPayload, TokenResponse, User } from "../types/auth";

export async function login(payload: LoginPayload) {
  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
