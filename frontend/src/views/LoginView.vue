<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ApiError } from "../api/client";
import { loginFormSchema } from "../schemas/auth";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  email: "",
  password: "",
});

const fieldErrors = reactive<Record<"email" | "password", string>>({
  email: "",
  password: "",
});
const formError = ref("");
const isSubmitting = ref(false);

function clearErrors(): void {
  fieldErrors.email = "";
  fieldErrors.password = "";
  formError.value = "";
}

async function handleSubmit(): Promise<void> {
  if (isSubmitting.value || authStore.loading) {
    return;
  }

  clearErrors();

  const validation = loginFormSchema.safeParse(form);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    fieldErrors.email = errors.email?.[0] ?? "";
    fieldErrors.password = errors.password?.[0] ?? "";
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.login(validation.data);
    await router.push(typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard");
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not sign in";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="auth-layout">
    <form class="panel auth-panel form-grid" @submit.prevent="handleSubmit">
      <h1>Login</h1>
      <div class="field">
        <label for="login-email">Email</label>
        <input id="login-email" v-model="form.email" type="email" autocomplete="email" />
        <span v-if="fieldErrors.email" class="error-text">{{ fieldErrors.email }}</span>
      </div>
      <div class="field">
        <label for="login-password">Password</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
        />
        <span v-if="fieldErrors.password" class="error-text">{{ fieldErrors.password }}</span>
      </div>
      <button class="button" type="submit" :disabled="authStore.loading || isSubmitting">
        {{ (authStore.loading || isSubmitting) ? "Signing in..." : "Sign in" }}
      </button>
      <p v-if="formError" class="error-text status-message">{{ formError }}</p>
      <p class="auth-switch">
        Need an account?
        <RouterLink to="/register">Register</RouterLink>
      </p>
    </form>
  </section>
</template>
