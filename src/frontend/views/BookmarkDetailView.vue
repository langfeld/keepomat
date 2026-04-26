<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <!-- Zurück-Link -->
    <button
      @click="router.back()"
      class="inline-flex items-center gap-1 mb-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm transition"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ t('common.back') }}
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <svg class="w-8 h-8 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Inhalt -->
    <div v-else-if="bookmark" class="mx-auto max-w-4xl">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-900 mb-6 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex items-start gap-4">
          <!-- Favicon -->
          <div class="flex justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-xl w-12 h-12 shrink-0">
            <img
              v-if="bookmark.favicon"
              :src="bookmark.favicon"
              class="w-8 h-8 object-contain"
              @error="(e: any) => e.target.style.display = 'none'"
            />
            <svg v-else class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <h1 class="font-bold text-gray-900 dark:text-white text-xl leading-snug">
              {{ bookmark.title || bookmark.url }}
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <a
                :href="bookmark.url"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm break-all transition"
                @click="markAsRead"
              >
                {{ bookmark.url }}
                <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <StarRating v-if="bookmark.rating" :model-value="bookmark.rating" readonly show-value />
            </div>
          </div>

          <!-- Aktionen -->
          <div class="flex items-center gap-1 shrink-0">
            <button
              @click="toggleFavorite"
              :class="bookmark.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'"
              class="p-2 rounded-lg transition"
              :title="t('bookmark.favorite')"
            >
              <svg class="w-5 h-5" :fill="bookmark.isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              @click="toggleRead"
              :class="bookmark.isRead ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-green-500'"
              class="p-2 rounded-lg transition"
              :title="bookmark.isRead ? t('bookmark.markUnread') : t('bookmark.markRead')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              @click="quickEditingBookmark = { ...bookmark }"
              :class="bookmark.notes || bookmark.rating ? 'text-primary-400 hover:text-primary-500' : 'text-gray-300 hover:text-primary-500 dark:text-gray-600'"
              class="p-2 rounded-lg transition"
              :title="t('bookmark.quickEdit')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              @click="editingBookmark = { ...bookmark }"
              class="p-2 rounded-lg text-gray-300 hover:text-primary-500 dark:text-gray-600 transition"
              :title="t('common.edit')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete"
              class="p-2 rounded-lg text-gray-300 hover:text-red-500 dark:text-gray-600 transition"
              :title="t('common.delete')"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Status-Badges -->
        <div class="flex flex-wrap items-center gap-2 mt-4">
          <span v-if="bookmark.isDeadLink" class="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-lg text-red-600 dark:text-red-400 text-xs">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ t('bookmark.deadLink') }}
          </span>
          <span v-if="bookmark.isRead" class="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg text-green-600 dark:text-green-400 text-xs">
            {{ t('bookmark.markRead') }}
          </span>
          <span v-if="bookmark.isFavorite" class="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
            {{ t('bookmark.favorite') }}
          </span>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="gap-6 grid grid-cols-1 lg:grid-cols-3">
        <!-- Linke Spalte: Hauptinhalt -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Beschreibung -->
          <div v-if="bookmark.description" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmarkDetail.description') }}</h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{{ bookmark.description }}</p>
          </div>

          <!-- AI-Zusammenfassung -->
          <div v-if="bookmark.aiSummary" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="flex items-center gap-2 mb-3 font-semibold text-gray-900 dark:text-white text-sm">
              <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              {{ t('bookmark.aiSummary') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{{ bookmark.aiSummary }}</p>
          </div>

          <!-- Notizen -->
          <div v-if="bookmark.notes" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmarkDetail.notes') }}</h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{{ bookmark.notes }}</p>
          </div>

          <!-- Screenshot -->
          <div v-if="bookmark.screenshot" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <div class="flex justify-between items-center mb-3">
              <h2 class="font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmark.screenshot') }}</h2>
              <button
                @click="retakeScreenshot"
                class="text-gray-400 hover:text-primary-500 text-xs transition"
              >
                {{ t('bookmark.retakeScreenshot') }}
              </button>
            </div>
            <div class="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <img
                :src="`/api/bookmarks/${bookmark.id}/screenshot?t=${bookmark.updatedAt || ''}`"
                :alt="bookmark.title || 'Screenshot'"
                class="w-full"
                loading="lazy"
              />
            </div>
          </div>

          <!-- OG-Image -->
          <div v-if="bookmark.ogImage && !bookmark.screenshot" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmarkDetail.previewImage') }}</h2>
            <div class="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <img :src="bookmark.ogImage" :alt="bookmark.title || ''" class="w-full" loading="lazy" />
            </div>
          </div>

          <!-- Fallback-Bild -->
          <div v-if="!bookmark.screenshot && !bookmark.ogImage" class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmarkDetail.previewImage') }}</h2>
            <div class="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <img :src="fallbackImage" :alt="bookmark.title || ''" class="w-full" loading="lazy" />
            </div>
          </div>
        </div>

        <!-- Rechte Spalte: Metadaten -->
        <div class="space-y-6">
          <!-- Tags -->
          <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">Tags</h2>
            <div v-if="bookmark.tags?.length" class="flex flex-wrap gap-2">
              <router-link
                v-for="tag in bookmark.tags"
                :key="tag.id"
                :to="{ name: 'bookmarks', query: { tag: tag.id } }"
                class="inline-flex bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-2.5 py-1 rounded-lg text-primary-600 dark:text-primary-400 text-xs transition"
              >
                {{ tag.name }}
              </router-link>
            </div>
            <p v-else class="text-gray-400 dark:text-gray-500 text-sm">{{ t('bookmarkDetail.noTags') }}</p>
          </div>

          <!-- Ordner -->
          <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('nav.folders') }}</h2>
            <div v-if="bookmark.folders?.length" class="space-y-1">
              <router-link
                v-for="folder in bookmark.folders"
                :key="folder.id"
                :to="{ name: 'folders', params: { folderId: folder.id } }"
                class="flex items-center gap-2 py-1 text-gray-600 hover:text-primary-500 dark:text-gray-400 text-sm transition"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {{ folder.name }}
              </router-link>
            </div>
            <p v-else class="text-gray-400 dark:text-gray-500 text-sm">{{ t('common.noFolder') }}</p>
          </div>

          <!-- Zeitstempel -->
          <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
            <h2 class="mb-3 font-semibold text-gray-900 dark:text-white text-sm">{{ t('bookmarkDetail.metadata') }}</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ t('bookmarkDetail.createdAt') }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ formatDate(bookmark.createdAt) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ t('bookmarkDetail.updatedAt') }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ formatDate(bookmark.updatedAt) }}</dd>
              </div>
              <div v-if="bookmark.lastCheckedAt" class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ t('bookmarkDetail.lastChecked') }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ formatDate(bookmark.lastCheckedAt) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">{{ t('bookmarkDetail.domain') }}</dt>
                <dd class="text-gray-900 dark:text-white truncate ml-4">{{ hostname }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Nicht gefunden -->
    <div v-else class="bg-white dark:bg-gray-900 p-12 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
      <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t('bookmarkDetail.notFound') }}</p>
    </div>

    <!-- Edit Modal -->
    <EditBookmarkModal
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @close="editingBookmark = null"
      @saved="handleSaved"
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import { useSettingsStore } from "../stores/settings";
import { getFallbackImage } from "../utils/fallbackImage";
import EditBookmarkModal from "../components/EditBookmarkModal.vue";
import QuickEditModal from "../components/QuickEditModal.vue";
import StarRating from "../components/StarRating.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();
const settingsStore = useSettingsStore();

const bookmark = ref<any>(null);
const loading = ref(true);
const editingBookmark = ref<any>(null);
const quickEditingBookmark = ref<any>(null);

const hostname = computed(() => {
  try {
    return new URL(bookmark.value?.url || "").hostname;
  } catch {
    return bookmark.value?.url || "";
  }
});

const fallbackImage = computed(() => {
  return bookmark.value ? getFallbackImage(bookmark.value.id) : "";
});

function formatDate(date: string | Date | null): string {
  if (!date) return "–";
  const d = new Date(typeof date === "number" ? date * 1000 : date);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadBookmark() {
  const id = route.params.id;
  if (!id) return;

  loading.value = true;
  try {
    const res = await fetch(`/api/bookmarks/${id}`, { credentials: "include" });
    if (res.ok) {
      bookmark.value = await res.json();
    }
  } catch (e) {
    console.error("Bookmark laden fehlgeschlagen:", e);
  } finally {
    loading.value = false;
  }
}

async function toggleFavorite() {
  if (!bookmark.value) return;
  try {
    const res = await fetch(`/api/bookmarks/${bookmark.value.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isFavorite: !bookmark.value.isFavorite }),
    });
    if (res.ok) {
      bookmark.value.isFavorite = !bookmark.value.isFavorite;
    }
  } catch {}
}

async function toggleRead() {
  if (!bookmark.value) return;
  try {
    const res = await fetch(`/api/bookmarks/${bookmark.value.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isRead: !bookmark.value.isRead }),
    });
    if (res.ok) {
      bookmark.value.isRead = !bookmark.value.isRead;
    }
  } catch {}
}

async function markAsRead() {
  if (bookmark.value && !bookmark.value.isRead) {
    try {
      await fetch(`/api/bookmarks/${bookmark.value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRead: true }),
      });
      bookmark.value.isRead = true;
    } catch {}
  }
}

async function retakeScreenshot() {
  if (!bookmark.value) return;
  try {
    toast.info(t('toast.screenshotCreating'));
    const res = await fetch(`/api/bookmarks/${bookmark.value.id}/screenshot`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      toast.success(t('toast.screenshotCreated'));
      await loadBookmark();
    } else {
      toast.error(t('toast.screenshotFailed'));
    }
  } catch {
    toast.error(t('toast.screenshotFailed'));
  }
}

async function handleDelete() {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('bookmarks.deleteConfirm'),
    confirmText: t('common.delete'),
    variant: 'danger',
  });
  if (!ok) return;

  try {
    const res = await fetch(`/api/bookmarks/${bookmark.value.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success(t('toast.bookmarkDeleted'));
      router.push({ name: "bookmarks" });
    }
  } catch {
    toast.error(t('common.saveError'));
  }
}

function handleSaved() {
  editingBookmark.value = null;
  loadBookmark();
}

function handleQuickEditSaved() {
  quickEditingBookmark.value = null;
  loadBookmark();
}

onMounted(() => {
  loadBookmark();
});
</script>
