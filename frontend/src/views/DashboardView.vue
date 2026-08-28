<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { ApiError } from "../api/client";
import { createLink, fetchLinks, type LinkSummary } from "../api/links";
import { createLinkFormSchema } from "../schemas/link";

const links = ref<LinkSummary[]>([]);
const loading = ref(true);
const submitting = ref(false);
const formError = ref("");
const successMessage = ref("");

const form = reactive({
  originalUrl: "",
});

const fieldErrors = reactive({
  originalUrl: "",
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadLinks(): Promise<void> {
  loading.value = true;
  formError.value = "";

  try {
    links.value = await fetchLinks();
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not load links";
  } finally {
    loading.value = false;
  }
}

async function handleCreate(): Promise<void> {
  fieldErrors.originalUrl = "";
  formError.value = "";
  successMessage.value = "";

  try {
    const validation = createLinkFormSchema.safeParse(form);

    if (!validation.success) {
      fieldErrors.originalUrl =
        validation.error.flatten().fieldErrors.originalUrl?.[0] ?? "";
      return;
    }

    submitting.value = true;
    const link = await createLink(validation.data.originalUrl);
    links.value = [link, ...links.value];
    form.originalUrl = "";
    successMessage.value = "Short link created";
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not create link";
  } finally {
    submitting.value = false;
  }
}

async function copyShortUrl(shortUrl: string): Promise<void> {
  await navigator.clipboard.writeText(shortUrl);
  successMessage.value = "Copied";
}

onMounted(() => {
  void loadLinks();
});
</script>

<template>
  <section>
    <div class="toolbar">
      <h1>Dashboard</h1>
    </div>

    <form class="panel inline-form" @submit.prevent="handleCreate">
      <div class="field">
        <label for="original-url">Original URL</label>
        <input
          id="original-url"
          v-model="form.originalUrl"
          type="url"
          placeholder="https://example.com/article"
          autocomplete="url"
        />
        <span v-if="fieldErrors.originalUrl" class="error-text">
          {{ fieldErrors.originalUrl }}
        </span>
      </div>
      <button class="button" type="submit" :disabled="submitting">
        {{ submitting ? "Creating..." : "Shorten" }}
      </button>
    </form>

    <p v-if="formError" class="error-text status-message">{{ formError }}</p>
    <p v-if="successMessage" class="muted status-message">{{ successMessage }}</p>

    <div class="panel table-wrap" style="margin-top: 24px">
      <div v-if="loading" class="empty-state">Loading links...</div>
      <div v-else-if="links.length === 0" class="empty-state">No links yet</div>
      <table v-else class="links-table">
        <thead>
          <tr>
            <th>Link</th>
            <th>Clicks</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="link in links" :key="link.id">
            <td>
              <div class="url-cell">
                <a class="short-link" :href="link.shortUrl" target="_blank" rel="noreferrer">
                  {{ link.shortUrl }}
                </a>
                <span class="original-url">{{ link.originalUrl }}</span>
              </div>
            </td>
            <td>{{ link.clickCount }}</td>
            <td>{{ formatDate(link.createdAt) }}</td>
            <td>
              <div class="copy-row">
                <RouterLink class="ghost-button" :to="`/links/${link.id}`">Stats</RouterLink>
                <button class="ghost-button" type="button" @click="copyShortUrl(link.shortUrl)">
                  Copy
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
