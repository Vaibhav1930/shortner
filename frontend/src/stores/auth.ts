import { defineStore } from "pinia";
import * as authApi from "../api/auth";
import type { AuthPayload, User } from "../api/auth";

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    loading: false,
  }),
  actions: {
    async register(payload: AuthPayload): Promise<void> {
      this.loading = true;

      try {
        const response = await authApi.register(payload);
        if (response.token) {
          localStorage.setItem("accessToken", response.token);
        }
        this.user = response.user;
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },
    async login(payload: AuthPayload): Promise<void> {
      this.loading = true;

      try {
        const response = await authApi.login(payload);
        if (response.token) {
          localStorage.setItem("accessToken", response.token);
        }
        this.user = response.user;
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },
    async logout(): Promise<void> {
      this.loading = true;

      try {
        await authApi.logout();
      } finally {
        localStorage.removeItem("accessToken");
        this.user = null;
        this.initialized = true;
        this.loading = false;
      }
    },
    async fetchCurrentUser(): Promise<void> {
      if (this.initialized) {
        return;
      }

      this.loading = true;

      try {
        const response = await authApi.getCurrentUser();
        this.user = response.user;
      } catch {
        localStorage.removeItem("accessToken");
        this.user = null;
      } finally {
        this.initialized = true;
        this.loading = false;
      }
    },
  },
});
