import { api } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/register", { name, email, password });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", { email, password });
  },

  async getProfile(): Promise<AuthUser> {
    return api.get<AuthUser>("/me");
  },
};
