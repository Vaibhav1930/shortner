<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ApiError } from "../api/client";
import { fetchLinkStats, type LinkStats } from "../api/links";

const route = useRoute();
const link = ref<LinkStats | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const copied = ref(false);

const linkId = computed(() => String(route.params.id));

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadStats(): Promise<void> {
  loading.value = true;
  errorMessage.value = "";

  try {
    link.value = await fetchLinkStats(linkId.value);
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Could not load stats";
  } finally {
    loading.value = false;
  }
}

async function copyShortUrl(): Promise<void> {
  if (!link.value) {
    return;
  }

  await navigator.clipboard.writeText(link.value.shortUrl);
  copied.value = true;
}

onMounted(() => {
  void loadStats();
});
</script>

<template>
  <section>
    <RouterLink class="ghost-button" to="/dashboard">Back</RouterLink>

    <div v-if="loading" class="empty-state">Loading stats...</div>
    <p v-else-if="errorMessage" class="error-text status-message">{{ errorMessage }}</p>

    <template v-else-if="link">
      <div class="stats-header" style="margin-top: 18px">
        <h1>Link stats</h1>
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
