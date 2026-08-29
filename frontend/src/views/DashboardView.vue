<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ApiError } from "../api/client";
import {
  createLink,
  deleteLink,
  fetchLinks,
  type LinkSummary,
  type PaginationMetadata,
} from "../api/links";
import { createLinkFormSchema } from "../schemas/link";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const links = ref<LinkSummary[]>([]);
const pagination = ref<PaginationMetadata | null>(null);
const page = ref(1);
const limit = ref(10);

const loading = ref(true);
const submitting = ref(false);
const deletingId = ref<string | null>(null);
const formError = ref("");
const successMessage = ref("");

const POLL_INTERVAL_MS = 15000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let messageTimer: ReturnType<typeof setTimeout> | null = null;

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

function setAutoClearingSuccess(message: string, durationMs = 2500): void {
  successMessage.value = message;
  if (messageTimer) {
    clearTimeout(messageTimer);
  }
  messageTimer = setTimeout(() => {
    if (successMessage.value === message) {
      successMessage.value = "";
    }
  }, durationMs);
}

async function loadLinks(silent = false): Promise<void> {
  if (!silent) {
    loading.value = true;
    formError.value = "";
  }

  try {
    const response = await fetchLinks(page.value, limit.value);
    links.value = response.links;
    pagination.value = response.pagination;
    if (silent) {
      formError.value = "";
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.user = null;
      stopPolling();
      await router.push({ name: "login" });
      return;
    }
    if (!silent) {
      formError.value = error instanceof ApiError ? error.message : "Could not load links";
    }
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

function goToPage(newPage: number): void {
  if (newPage < 1 || (pagination.value && newPage > pagination.value.totalPages)) {
    return;
  }
  page.value = newPage;
  void loadLinks();
}

function startPolling(): void {
  stopPolling();
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible" && !submitting.value && !deletingId.value) {
      void loadLinks(true);
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    void loadLinks(true);
  }
}

async function handleCreate(): Promise<void> {
  fieldErrors.originalUrl = "";
  formError.value = "";
  successMessage.value = "";

  const validation = createLinkFormSchema.safeParse(form);

  if (!validation.success) {
    fieldErrors.originalUrl =
      validation.error.flatten().fieldErrors.originalUrl?.[0] ?? "";
    return;
  }

  submitting.value = true;

  try {
    await createLink(validation.data.originalUrl);
    form.originalUrl = "";
    page.value = 1;
    await loadLinks(true);
    setAutoClearingSuccess("Short link created", 3000);
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not create link";
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(linkId: string): Promise<void> {
  const confirmed = window.confirm(
    "Are you sure you want to delete this short link? All recorded click data for this link will be permanently removed."
  );

  if (!confirmed) {
    return;
  }

  deletingId.value = linkId;
  formError.value = "";

  try {
    await deleteLink(linkId);
    setAutoClearingSuccess("Link deleted successfully", 3000);

    // If deleting the last item on the current page leaves the page empty, handle pagination gracefully
    if (links.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }

    await loadLinks(true);
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : "Could not delete link";
  } finally {
    deletingId.value = null;
  }
}

async function copyShortUrl(shortUrl: string): Promise<void> {
  await navigator.clipboard.writeText(shortUrl);
  setAutoClearingSuccess("Copied", 2000);
}

onMounted(() => {
  void loadLinks().then(() => {
    startPolling();
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  stopPolling();
  if (messageTimer) {
    clearTimeout(messageTimer);
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <section>
    <div class="toolbar">
      <div style="display: flex; align-items: center; gap: 10px">
        <h1>Dashboard</h1>
        <span class="live-pill" title="Auto-updating clicks every 15 seconds">
          <span class="pulse-dot"></span> Live
        </span>
      </div>
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
      <template v-else>
        <table class="links-table">
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
                  <button
                    class="danger-button"
                    type="button"
                    :disabled="deletingId === link.id"
                    @click="handleDelete(link.id)"
                  >
                    {{ deletingId === link.id ? "Deleting..." : "Delete" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div v-if="pagination && pagination.total > 0" class="pagination-bar">
          <span class="pagination-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }} ({{ pagination.total }} {{ pagination.total === 1 ? 'link' : 'links' }})
          </span>
          <div class="pagination-controls">
            <button
              class="ghost-button"
              type="button"
              :disabled="!pagination.hasPrevious || loading"
              @click="goToPage(pagination.page - 1)"
            >
              Previous
            </button>
            <button
              class="ghost-button"
              type="button"
              :disabled="!pagination.hasNext || loading"
              @click="goToPage(pagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
