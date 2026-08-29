import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        return token ? "/dashboard" : "/login";
      },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { guestOnly: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/links/:id",
      name: "link-stats",
      component: () => import("../views/LinkStatsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

router.beforeEach(async (to) => {

  const authStore = useAuthStore();
  const hasToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("accessToken"));

  // If a public/guest page is visited without any stored token, render immediately
  // without blocking on an unnecessary /api/auth/me request
  if (to.meta.guestOnly && !hasToken) {
    if (!authStore.initialized) {
      authStore.user = null;
      authStore.initialized = true;
    }
    return true;
  }

  if (!authStore.initialized) {
    await authStore.fetchCurrentUser();
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && authStore.user) {
    return { name: "dashboard" };
  }

  return true;
});

