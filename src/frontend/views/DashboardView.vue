<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">{{ t('dashboard.title') }}</h1>

    <!-- Statistik-Karten -->
    <div class="gap-4 grid grid-cols-2 lg:grid-cols-4 mb-8">
      <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex justify-center items-center bg-primary-100 dark:bg-primary-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </div>
        <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.bookmarks }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('dashboard.statBookmarks') }}</p>
      </div>

      <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex justify-center items-center bg-amber-100 dark:bg-amber-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        </div>
        <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.folders }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('dashboard.statFolders') }}</p>
      </div>

      <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex justify-center items-center bg-green-100 dark:bg-green-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
        <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.tags }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('dashboard.statTags') }}</p>
      </div>

      <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex justify-center items-center bg-red-100 dark:bg-red-900/30 rounded-xl w-10 h-10">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>
        <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.unread }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('dashboard.statUnread') }}</p>
      </div>
    </div>

    <!-- Zuletzt hinzugefügt -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('dashboard.recentlyAdded') }}</h2>
        <router-link to="/bookmarks" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">
          {{ t('dashboard.showAll') }}
        </router-link>
      </div>
      <div v-if="recentBookmarks.length" class="gap-3 grid">
        <BookmarkCard
          v-for="bookmark in recentBookmarks"
          :key="bookmark.id"
          :bookmark="bookmark"
          compact
        />
      </div>
      <div v-else class="bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
        <svg class="mx-auto mb-3 w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">{{ t('dashboard.emptyBookmarks') }}</p>
        <p class="mt-1 text-gray-400 dark:text-gray-500 text-sm">{{ t('dashboard.emptyBookmarksHint') }}</p>
      </div>
    </div>

    <!-- Favoriten -->
    <div v-if="favorites.length">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('dashboard.favorites') }}</h2>
        <router-link to="/bookmarks?filter=favorites" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">
          {{ t('dashboard.showAll') }}
        </router-link>
      </div>
      <div class="gap-3 grid">
        <BookmarkCard
          v-for="bookmark in favorites"
          :key="bookmark.id"
          :bookmark="bookmark"
          compact
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import BookmarkCard from "../components/BookmarkCard.vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const stats = ref({ bookmarks: 0, folders: 0, tags: 0, unread: 0 });
const recentBookmarks = ref<any[]>([]);
const favorites = ref<any[]>([]);

onMounted(async () => {
  try {
    const [statsRes, recentRes, favRes] = await Promise.all([
      fetch("/api/bookmarks?limit=1"),
      fetch("/api/bookmarks?limit=5&sort=createdAt&order=desc"),
      fetch("/api/bookmarks?limit=5&isFavorite=true"),
    ]);

    if (statsRes.ok) {
      const d = await statsRes.json();
      stats.value.bookmarks = d.total || 0;
    }

    if (recentRes.ok) {
      const d = await recentRes.json();
      recentBookmarks.value = d.data || [];
      stats.value.unread = d.total || 0;
    }

    if (favRes.ok) {
      const d = await favRes.json();
      favorites.value = d.data || [];
    }

    // Ordner und Tags zählen
    const [foldersRes, tagsRes] = await Promise.all([
      fetch("/api/folders"),
      fetch("/api/tags"),
    ]);
    if (foldersRes.ok) {
      const d = await foldersRes.json();
      stats.value.folders = d.length || 0;
    }
    if (tagsRes.ok) {
      const d = await tagsRes.json();
      stats.value.tags = d.length || 0;
    }
  } catch (e) {
    console.error("Dashboard-Daten laden fehlgeschlagen:", e);
  }
});
</script>
