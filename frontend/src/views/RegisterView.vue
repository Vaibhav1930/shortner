<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ApiError } from "../api/client";
import { authFormSchema } from "../schemas/auth";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();

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

  const validation = authFormSchema.safeParse(form);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    fieldErrors.email = errors.email?.[0] ?? "";
    fieldErrors.password = errors.password?.[0] ?? "";
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.register(validation.data);
    await router.push("/dashboard");
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not create account";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="auth-layout">
    <form class="panel auth-panel form-grid" @submit.prevent="handleSubmit">
      <h1>Register</h1>
      <div class="field">
        <label for="register-email">Email</label>
        <input id="register-email" v-model="form.email" type="email" autocomplete="email" />
        <span v-if="fieldErrors.email" class="error-text">{{ fieldErrors.email }}</span>
      </div>
      <div class="field">
        <label for="register-password">Password</label>
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
        />
        <span v-if="fieldErrors.password" class="error-text">{{ fieldErrors.password }}</span>
      </div>
      <button class="button" type="submit" :disabled="authStore.loading || isSubmitting">
        {{ (authStore.loading || isSubmitting) ? "Creating..." : "Create account" }}
      </button>
      <p v-if="formError" class="error-text status-message">{{ formError }}</p>
      <p class="auth-switch">
        Already registered?
        <RouterLink to="/login">Login</RouterLink>
      </p>
    </form>
  </section>
</template>
