<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

async function handleLogout(): Promise<void> {
  await authStore.logout();
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/dashboard">Shortly</RouterLink>
    <nav class="nav-actions" aria-label="Main navigation">
      <RouterLink v-if="authStore.user" to="/dashboard">Dashboard</RouterLink>
      <button v-if="authStore.user" class="ghost-button" type="button" @click="handleLogout">
        Sign out
      </button>
      <RouterLink v-if="!authStore.user" to="/login">Login</RouterLink>
      <RouterLink v-if="!authStore.user" class="primary-link" to="/register">Register</RouterLink>
    </nav>
  </header>
  <main class="page-shell">
    <RouterView />
  </main>
</template>
