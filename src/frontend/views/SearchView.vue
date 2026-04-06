<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">{{ t('search.title') }}</h1>

    <!-- Suchfeld -->
    <div class="mb-6">
      <div class="relative">
        <svg class="top-1/2 left-4 absolute w-5 h-5 text-gray-400 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="query"
          type="search"
          :placeholder="t('search.placeholder')"
          class="bg-white dark:bg-gray-900 py-3 pr-4 pl-12 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-lg transition placeholder-gray-400"
          @input="debouncedSearch"
          autofocus
        />
        <span v-if="loading" class="top-1/2 right-4 absolute -translate-y-1/2">
          <svg class="w-5 h-5 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      </div>
    </div>

    <!-- Ergebnisse -->
    <div v-if="results.length" class="space-y-3">
      <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">
        {{ total }} {{ t('search.resultsFor', { query: lastQuery }) }}
      </p>
      <BookmarkCard
        v-for="bookmark in results"
        :key="bookmark.id"
        :bookmark="bookmark"
        compact
        :highlight="lastQuery"
      />

      <div v-if="hasMore" class="pt-4 text-center">
        <button
          @click="loadMore"
          :disabled="loading"
          class="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
        >
          {{ t('common.loadMore') }}
        </button>
      </div>
    </div>

    <div v-else-if="searched && !loading" class="bg-white dark:bg-gray-900 p-12 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
      <svg class="mx-auto mb-4 w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t('search.noResults') }}</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-sm">{{ t('search.noResultsHint') }}</p>

      <!-- AI-Suche Button -->
      <button
        v-if="!aiSearching && !aiResults.length"
        @click="aiSearch"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 mt-4 px-5 py-2.5 rounded-xl font-medium text-white text-sm transition"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        {{ t('search.aiSearch') }}
      </button>
      <div v-if="aiSearching" class="flex justify-center items-center gap-2 mt-4">
        <svg class="w-5 h-5 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('search.aiSearching') }}</span>
      </div>
    </div>

    <!-- AI-Suchergebnisse -->
    <div v-if="aiResults.length" class="space-y-3">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          {{ t('search.aiResultsFor', { query: lastQuery, count: String(aiResults.length) }) }}
        </p>
      </div>
      <p v-if="aiReason" class="bg-primary-50/50 dark:bg-primary-900/10 mb-4 p-3 rounded-xl text-gray-600 dark:text-gray-400 text-xs italic">
        {{ aiReason }}
      </p>
      <BookmarkCard
        v-for="bookmark in aiResults"
        :key="bookmark.id"
        :bookmark="bookmark"
        compact
        :highlight="lastQuery"
      />
    </div>

    <div v-else-if="!searched" class="bg-white dark:bg-gray-900 p-12 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
      <svg class="mx-auto mb-4 w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t('search.fulltext') }}</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-sm">{{ t('search.fulltextHint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import BookmarkCard from "../components/BookmarkCard.vue";
import { useI18n } from "../composables/useI18n";

const route = useRoute();
const { t } = useI18n();

const query = ref("");
const lastQuery = ref("");
const results = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const searched = ref(false);
const hasMore = ref(false);
const page = ref(1);
const aiSearching = ref(false);
const aiResults = ref<any[]>([]);
const aiReason = ref("");

let debounceTimer: ReturnType<typeof setTimeout>;

function debouncedSearch() {
  clearTimeout(debounceTimer);
  aiResults.value = [];
  aiReason.value = "";
  debounceTimer = setTimeout(() => {
    page.value = 1;
    search();
  }, 300);
}

async function search() {
  if (!query.value.trim()) {
    results.value = [];
    searched.value = false;
    return;
  }

  loading.value = true;
  lastQuery.value = query.value;

  try {
    const params = new URLSearchParams({
      q: query.value,
      page: page.value.toString(),
      limit: "20",
    });

    const res = await fetch(`/api/search?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (page.value === 1) {
        results.value = data.data || [];
      } else {
        results.value.push(...(data.data || []));
      }
      total.value = data.total || 0;
      hasMore.value = results.value.length < total.value;
    }
  } catch (e) {
    console.error("Suche fehlgeschlagen:", e);
  } finally {
    loading.value = false;
    searched.value = true;
  }
}

function loadMore() {
  page.value++;
  search();
}

async function aiSearch() {
  if (!lastQuery.value.trim()) return;
  aiSearching.value = true;
  try {
    const res = await fetch("/api/search/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ q: lastQuery.value }),
    });
    if (res.ok) {
      const data = await res.json();
      aiResults.value = data.data || [];
      aiReason.value = data.aiReason || "";
    }
  } catch (e) {
    console.error("AI-Suche fehlgeschlagen:", e);
  } finally {
    aiSearching.value = false;
  }
}

onMounted(() => {
  if (route.query.q) {
    query.value = route.query.q as string;
    search();
  }
});
</script>
