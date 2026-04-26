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

    <!-- Schnellstart-Tipps -->
    <div v-if="showQuickStart" class="mb-8">
      <div class="bg-linear-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-5 border border-primary-200 dark:border-primary-800 rounded-2xl">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('dashboard.quickStart') }}</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('dashboard.quickStartHint') }}</p>
          </div>
          <button @click="dismissQuickStart" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="gap-3 grid sm:grid-cols-2 lg:grid-cols-3">
          <router-link to="/settings#telegram" class="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition group">
            <div class="flex justify-center items-center bg-sky-100 dark:bg-sky-900/30 rounded-lg w-8 h-8 shrink-0">
              <svg class="w-4 h-4 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">{{ t('dashboard.quickStartTelegram') }}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">{{ t('dashboard.quickStartTelegramDesc') }}</p>
            </div>
          </router-link>
          <router-link to="/settings#api-keys" class="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition group">
            <div class="flex justify-center items-center bg-amber-100 dark:bg-amber-900/30 rounded-lg w-8 h-8 shrink-0">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">{{ t('dashboard.quickStartApiKey') }}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">{{ t('dashboard.quickStartApiKeyDesc') }}</p>
            </div>
          </router-link>
          <router-link to="/settings#userscript" class="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition group">
            <div class="flex justify-center items-center bg-amber-100 dark:bg-amber-900/30 rounded-lg w-8 h-8 shrink-0">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">{{ t('dashboard.quickStartUserscript') }}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">{{ t('dashboard.quickStartUserscriptDesc') }}</p>
            </div>
          </router-link>
        </div>
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
          @toggleFavorite="handleToggleFavorite"
          @toggleRead="handleToggleRead"
          @retakeScreenshot="handleRetakeScreenshot"
          @edit="handleEdit"
          @quickEdit="handleQuickEdit"
          @delete="handleDelete"
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
          @toggleFavorite="handleToggleFavorite"
          @toggleRead="handleToggleRead"
          @retakeScreenshot="handleRetakeScreenshot"
          @edit="handleEdit"
          @quickEdit="handleQuickEdit"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Edit Modal -->
    <EditBookmarkModal
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @close="editingBookmark = null"
      @saved="handleBookmarkSaved"
    />

    <!-- Quick Edit Modal -->
    <QuickEditModal
      v-if="quickEditingBookmark"
      :bookmark="quickEditingBookmark"
      @close="quickEditingBookmark = null"
      @saved="handleQuickEditSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import BookmarkCard from "../components/BookmarkCard.vue";
import EditBookmarkModal from "../components/EditBookmarkModal.vue";
import QuickEditModal from "../components/QuickEditModal.vue";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import { useLocalStorage } from "../composables/useLocalStorage";

const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();

const stats = ref({ bookmarks: 0, folders: 0, tags: 0, unread: 0 });
const recentBookmarks = ref<any[]>([]);
const favorites = ref<any[]>([]);

const editingBookmark = ref<any>(null);
const quickEditingBookmark = ref<any>(null);
const quickStartDismissed = useLocalStorage("keepomat-quickstart-dismissed", false);
const showQuickStart = ref(!quickStartDismissed.value);

function dismissQuickStart() {
  showQuickStart.value = false;
  quickStartDismissed.value = true;
}

function updateLocalBookmark(id: number, data: Record<string, any>) {
  for (const list of [recentBookmarks, favorites]) {
    const idx = list.value.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      list.value[idx] = { ...list.value[idx], ...data };
    }
  }
}

function removeLocalBookmark(id: number) {
  recentBookmarks.value = recentBookmarks.value.filter((b: any) => b.id !== id);
  favorites.value = favorites.value.filter((b: any) => b.id !== id);
}

async function handleToggleFavorite(bookmark: any) {
  try {
    const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isFavorite: !bookmark.isFavorite }),
    });
    if (!res.ok) throw new Error();
    const updated = await res.json();
    updateLocalBookmark(bookmark.id, updated);
    // Favoriten-Liste aktualisieren
    if (!updated.isFavorite) {
      favorites.value = favorites.value.filter((b: any) => b.id !== bookmark.id);
    } else if (!favorites.value.find((b: any) => b.id === bookmark.id)) {
      favorites.value.unshift({ ...bookmark, ...updated });
    }
  } catch {
    toast.error(t('toast.updateFailed'));
  }
}

async function handleToggleRead(bookmark: any) {
  try {
    const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isRead: !bookmark.isRead }),
    });
    if (!res.ok) throw new Error();
    const updated = await res.json();
    updateLocalBookmark(bookmark.id, updated);
  } catch {
    toast.error(t('toast.updateFailed'));
  }
}

async function handleRetakeScreenshot(bookmark: any) {
  try {
    toast.info(t('toast.screenshotCreating'));
    const res = await fetch(`/api/bookmarks/${bookmark.id}/screenshot`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error();
    toast.success(t('toast.screenshotCreated'));
  } catch {
    toast.error(t('toast.screenshotFailed'));
  }
}

function handleEdit(bookmark: any) {
  editingBookmark.value = { ...bookmark };
}

function handleQuickEdit(bookmark: any) {
  quickEditingBookmark.value = { ...bookmark };
}

function handleQuickEditSaved() {
  quickEditingBookmark.value = null;
  loadDashboardData();
}

async function handleDelete(id: number) {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('bookmarks.deleteConfirm'),
    confirmText: t('common.delete'),
    variant: 'danger',
  });
  if (!ok) return;
  try {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error();
    removeLocalBookmark(id);
    stats.value.bookmarks--;
    toast.success(t('toast.bookmarkDeleted'));
  } catch {
    toast.error(t('toast.deleteFailed'));
  }
}

async function handleBookmarkSaved() {
  editingBookmark.value = null;
  // Dashboard-Daten neu laden
  await loadDashboardData();
}

async function loadDashboardData() {
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
}

onMounted(loadDashboardData);
</script>
