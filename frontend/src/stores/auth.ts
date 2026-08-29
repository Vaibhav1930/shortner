import { defineStore } from "pinia";
import * as authApi from "../api/auth";
import type { AuthPayload, User } from "../api/auth";

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
}

let fetchCurrentUserPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    loading: false,
  }),
  actions: {
    async register(payload: AuthPayload): Promise<void> {
      if (this.loading) {
        return;
      }

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
      if (this.loading) {
        return;
      }

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

      if (fetchCurrentUserPromise) {
        return fetchCurrentUserPromise;
      }

      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      // If no token exists, the user is unauthenticated. Do not make an unnecessary
      // network call to /api/auth/me that would return 401.
      if (!storedToken) {
        this.user = null;
        this.initialized = true;
        return;
      }

      this.loading = true;

      fetchCurrentUserPromise = (async () => {
        try {
          const response = await authApi.getCurrentUser();
          this.user = response.user;
        } catch {
          // A 401 or network failure with a stored token indicates the token is
          // invalid or expired; clear the token gracefully without error alerts.
          localStorage.removeItem("accessToken");
          this.user = null;
        } finally {
          this.initialized = true;
          this.loading = false;
          fetchCurrentUserPromise = null;
        }
      })();

      return fetchCurrentUserPromise;
    },
  },
});

