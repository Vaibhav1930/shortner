<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ApiError } from "../api/client";
import { fetchLinkStats, type LinkStats } from "../api/links";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const link = ref<LinkStats | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const copied = ref(false);

const linkId = computed(() => String(route.params.id));
const POLL_INTERVAL_MS = 15000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadStats(silent = false): Promise<void> {
  if (!silent) {
    loading.value = true;
    errorMessage.value = "";
  }

  try {
    const data = await fetchLinkStats(linkId.value);
    link.value = data;
    if (silent) {
      errorMessage.value = "";
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authStore.user = null;
      stopPolling();
      await router.push({ name: "login" });
      return;
    }
    if (!silent) {
      errorMessage.value = error instanceof ApiError ? error.message : "Could not load stats";
    }
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

function startPolling(): void {
  stopPolling();
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      void loadStats(true);
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
    void loadStats(true);
  }
}

async function copyShortUrl(): Promise<void> {
  if (!link.value) {
    return;
  }

  await navigator.clipboard.writeText(link.value.shortUrl);
  copied.value = true;
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
  }
  copyResetTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

watch(linkId, () => {
  void loadStats();
  startPolling();
});

onMounted(() => {
  void loadStats().then(() => {
    startPolling();
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  stopPolling();
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <section>
    <RouterLink class="ghost-button" to="/dashboard">Back</RouterLink>

    <div v-if="loading" class="empty-state">Loading stats...</div>
    <p v-else-if="errorMessage" class="error-text status-message">{{ errorMessage }}</p>

    <template v-else-if="link">
      <div class="stats-header" style="margin-top: 18px">
        <div style="display: flex; align-items: center; gap: 10px">
          <h1 style="margin: 0">Link stats</h1>
          <span class="live-pill" title="Auto-updating stats every 15 seconds">
            <span class="pulse-dot"></span> Live
          </span>
        </div>
        <div class="copy-row">
          <a class="short-link" :href="link.shortUrl" target="_blank" rel="noreferrer">
            {{ link.shortUrl }}
          </a>
          <button class="ghost-button" type="button" @click="copyShortUrl">
            {{ copied ? "Copied" : "Copy" }}
          </button>
        </div>
      </div>

      <div class="stats-meta">
        <div class="metric">
          <span>Total clicks</span>
          <strong>{{ link.totalClicks }}</strong>
        </div>
        <div class="metric">
          <span>Created</span>
          <strong>{{ formatDate(link.createdAt) }}</strong>
        </div>
        <div class="metric">
          <span>Short code</span>
          <strong>{{ link.shortCode }}</strong>
        </div>
      </div>

      <div class="metric" style="margin: 12px 0 24px">
        <span>Original URL</span>
        <strong>
          <a :href="link.originalUrl" target="_blank" rel="noreferrer">
            {{ link.originalUrl }}
          </a>
        </strong>
      </div>

      <div class="panel table-wrap">
        <div v-if="link.clicks.length === 0" class="empty-state">No clicks recorded</div>
        <table v-else class="clicks-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>IP address</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="click in link.clicks" :key="click.id">
              <td>{{ formatDate(click.timestamp) }}</td>
              <td>{{ click.ipAddress ?? "Unknown" }}</td>
              <td>{{ click.userAgent ?? "Unknown" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
