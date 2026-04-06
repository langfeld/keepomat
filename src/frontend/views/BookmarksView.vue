<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <!-- Header -->
    <div class="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 class="font-bold text-gray-900 dark:text-white text-2xl">
          {{ currentFolder ? currentFolder.name : t('bookmarks.all') }}
        </h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400 text-sm">
          {{ bookmarksStore.total }} {{ t('nav.bookmarks') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Filter -->
        <SearchableSelect
          :model-value="filter"
          :options="filterOptions"
          :placeholder="t('bookmarks.filterAll')"
          @update:model-value="filter = String($event)"
          trigger-class="!py-2 !text-sm"
        />

        <!-- Tag-Filter -->
        <SearchableSelect
          :model-value="selectedTag"
          :options="tagOptions"
          :placeholder="t('bookmarks.filterAllTags')"
          @update:model-value="selectedTag = String($event)"
          trigger-class="!py-2 !text-sm"
        />

        <!-- Sortierung -->
        <SearchableSelect
          :model-value="sortBy"
          :options="sortOptions"
          :placeholder="t('bookmarks.sortBy')"
          @update:model-value="sortBy = String($event)"
          trigger-class="!py-2 !text-sm"
        />

        <!-- Ansicht -->
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl">
          <button
            @click="viewMode = 'list'"
            :class="viewMode === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
            class="p-2 rounded-lg transition"
            :title="t('bookmarks.viewList')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            @click="viewMode = 'grid'"
            :class="viewMode === 'grid' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
            class="p-2 rounded-lg transition"
            :title="t('bookmarks.viewGrid')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        <!-- Screenshot-Toggle -->
        <button
          @click="showScreenshots = !showScreenshots"
          :class="showScreenshots ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-300 dark:border-primary-700' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'"
          class="hover:bg-gray-50 dark:hover:bg-gray-700 p-2 border rounded-xl transition"
          :title="showScreenshots ? t('bookmarks.showImages') : t('bookmarks.showScreenshots')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- AI-Zusammenfassung Toggle -->
        <button
          @click="toggleAiSummary()"
          :class="showAiSummary ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-300 dark:border-primary-700' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'"
          class="hover:bg-gray-50 dark:hover:bg-gray-700 p-2 border rounded-xl transition"
          :title="showAiSummary ? t('bookmarks.hideAiSummary') : t('bookmarks.showAiSummary')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
          </svg>
        </button>

        <!-- Import/Export -->
        <div class="relative" ref="exportMenuRef">
          <button
            @click="showExportMenu = !showExportMenu"
            class="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 p-2 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          <div
            v-if="showExportMenu"
            class="right-0 z-10 absolute bg-white dark:bg-gray-800 shadow-lg mt-2 py-1 border border-gray-200 dark:border-gray-700 rounded-xl w-56"
          >
            <!-- Import-Sektion -->
            <div class="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ t('bookmarks.importSection') }}</div>
            <button @click="importHtmlBookmarks" class="hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 w-full text-gray-700 dark:text-gray-300 text-sm text-left">
              {{ t('bookmarks.importHtml') }}
            </button>
            <button @click="importJsonBookmarks" class="hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 w-full text-gray-700 dark:text-gray-300 text-sm text-left">
              {{ t('bookmarks.importJson') }}
            </button>
            <!-- Trennlinie -->
            <div class="my-1 border-t border-gray-200 dark:border-gray-700"></div>
            <!-- Export-Sektion -->
            <div class="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ t('bookmarks.exportSection') }}</div>
            <a href="/api/export/html" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportHtml') }}
            </a>
            <a href="/api/export/json" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportJson') }}
            </a>
            <a href="/api/export/json?includeImages=true" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportJsonImages') }}
            </a>
            <a href="/api/export/pdf" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportPdf') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Lesezeichen-Liste -->
    <div v-if="bookmarksStore.loading && !bookmarksStore.bookmarks.length" class="flex justify-center items-center py-20">
      <svg class="w-8 h-8 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else-if="bookmarksStore.bookmarks.length" :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'grid gap-3'">
      <BookmarkCard
        v-for="bookmark in bookmarksStore.bookmarks"
        :key="bookmark.id"
        :bookmark="bookmark"
        :compact="viewMode === 'list'"
        :showScreenshot="showScreenshots"
        :showAiSummary="showAiSummary"
        @edit="editBookmark"
        @delete="deleteBookmark"
        @toggleFavorite="handleToggleFavorite"
        @toggleRead="handleToggleRead"
        @retakeScreenshot="retakeScreenshot"
      />
    </div>

    <div v-else class="bg-white dark:bg-gray-900 p-12 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
      <svg class="mx-auto mb-4 w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t('bookmarks.empty') }}</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-sm">{{ t('bookmarks.emptyHint') }}</p>
    </div>

    <!-- Mehr laden -->
    <div v-if="bookmarksStore.hasMore" class="mt-6 text-center">
      <button
        @click="bookmarksStore.loadMore()"
        :disabled="bookmarksStore.loading"
        class="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
      >
        {{ bookmarksStore.loading ? t('common.loading') : t('common.loadMore') }}
      </button>
    </div>

    <!-- Versteckter Import-Input (HTML) -->
    <input ref="importHtmlInput" type="file" accept=".html,.htm" class="hidden" @change="handleHtmlImport" />
    <!-- Versteckter Import-Input (JSON) -->
    <input ref="importJsonInput" type="file" accept=".json" class="hidden" @change="handleJsonImport" />

    <!-- Edit Modal -->
    <EditBookmarkModal
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @close="editingBookmark = null"
      @saved="handleBookmarkSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useBookmarksStore } from "../stores/bookmarks";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import { useLocalStorage } from "../composables/useLocalStorage";
import BookmarkCard from "../components/BookmarkCard.vue";
import EditBookmarkModal from "../components/EditBookmarkModal.vue";
import SearchableSelect from "../components/SearchableSelect.vue";
import type { SelectOption } from "../components/SearchableSelect.vue";

const route = useRoute();
const bookmarksStore = useBookmarksStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();

const filter = ref("");
const filterOptions = computed<SelectOption[]>(() => [
  { value: 'unread', label: t('bookmarks.filterUnread') },
  { value: 'favorites', label: t('bookmarks.filterFavorites') },
  { value: 'dead', label: t('bookmarks.filterDead') },
]);
const selectedTag = ref("");
const sortBy = useLocalStorage<string>("bookmarkSort", "");
const sortOptions = computed<SelectOption[]>(() => [
  { value: 'createdAt_desc', label: t('bookmarks.sortNewest') },
  { value: 'createdAt_asc', label: t('bookmarks.sortOldest') },
  { value: 'title_asc', label: t('bookmarks.sortTitleAZ') },
  { value: 'title_desc', label: t('bookmarks.sortTitleZA') },
  { value: 'updatedAt_desc', label: t('bookmarks.sortUpdated') },
]);
const viewMode = useLocalStorage<"list" | "grid">("viewMode", "list");
const showScreenshots = useLocalStorage("showScreenshots", false);
const showAiSummary = computed(() => settingsStore.settings.showAiSummary);
function toggleAiSummary() {
  settingsStore.updateSettings({ showAiSummary: !showAiSummary.value });
}
const tags = ref<any[]>([]);
const tagOptions = computed<SelectOption[]>(() =>
  tags.value.map((tag) => ({ value: String(tag.id), label: tag.name }))
);
const showExportMenu = ref(false);
const exportMenuRef = ref<HTMLElement>();
const importHtmlInput = ref<HTMLInputElement>();
const importJsonInput = ref<HTMLInputElement>();
const editingBookmark = ref<any>(null);
const currentFolder = ref<any>(null);

// Ordner aus Route
// Tag-Filter aus Query-Parameter übernehmen
watch(
  () => route.query.tag,
  (tagId) => {
    if (tagId && typeof tagId === 'string') {
      selectedTag.value = tagId;
    }
  },
  { immediate: true }
);

watch(
  () => route.params.folderId,
  async (folderId) => {
    if (folderId) {
      try {
        const res = await fetch(`/api/folders/${folderId}`);
        if (res.ok) currentFolder.value = await res.json();
      } catch {}
    } else {
      currentFolder.value = null;
    }
    loadBookmarks();
  },
  { immediate: true }
);

watch([filter, selectedTag, sortBy], () => loadBookmarks());

async function loadBookmarks() {
  const params: Record<string, string> = {};
  if (route.params.folderId) params.folderId = route.params.folderId as string;
  if (selectedTag.value) params.tagId = selectedTag.value;
  if (filter.value === "unread") params.isRead = "false";
  if (filter.value === "favorites") params.isFavorite = "true";
  if (filter.value === "dead") params.isDeadLink = "true";
  if (sortBy.value) {
    const [sort, order] = sortBy.value.split("_");
    params.sort = sort;
    params.order = order;
  }

  await bookmarksStore.fetchBookmarks(params);
}

async function loadTags() {
  try {
    const res = await fetch("/api/tags");
    if (res.ok) tags.value = await res.json();
  } catch {}
}

function editBookmark(bookmark: any) {
  editingBookmark.value = { ...bookmark };
}

async function deleteBookmark(id: number) {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('bookmarks.deleteConfirm'),
    confirmText: t('common.delete'),
    variant: 'danger',
  });
  if (!ok) return;
  await bookmarksStore.deleteBookmark(id);
  toast.success(t('toast.bookmarkDeleted'));
}

async function retakeScreenshot(bookmark: any) {
  try {
    toast.info(t('toast.screenshotCreating'));
    await bookmarksStore.retakeScreenshot(bookmark.id);
    toast.success(t('toast.screenshotCreated'));
    await loadBookmarks();
  } catch {
    toast.error(t('toast.screenshotFailed'));
  }
}

async function handleToggleFavorite(bookmark: any) {
  try {
    await bookmarksStore.toggleFavorite(bookmark.id);
  } catch {
    toast.error(t('toast.updateFailed'));
  }
}

async function handleToggleRead(bookmark: any) {
  try {
    await bookmarksStore.toggleRead(bookmark.id);
  } catch {
    toast.error(t('toast.updateFailed'));
  }
}

function handleBookmarkSaved() {
  editingBookmark.value = null;
  loadBookmarks();
}

function importHtmlBookmarks() {
  showExportMenu.value = false;
  importHtmlInput.value?.click();
}

function importJsonBookmarks() {
  showExportMenu.value = false;
  importJsonInput.value?.click();
}

async function handleHtmlImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    toast.info(t('toast.importing'));
    const res = await fetch("/api/export/import", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const result = await res.json();
      toast.success(t('bookmarks.importResult', { imported: String(result.imported), skipped: String(result.skipped) }));
      loadBookmarks();
    } else {
      toast.error(t('common.importFailed'));
    }
  } catch {
    toast.error(t('common.importFailed'));
  }
  // Input zurücksetzen für erneuten Import derselben Datei
  if (importHtmlInput.value) importHtmlInput.value.value = '';
}

async function handleJsonImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    toast.info(t('toast.importing'));
    const res = await fetch("/api/export/import-json", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const result = await res.json();
      toast.success(t('bookmarks.importResult', { imported: String(result.imported), skipped: String(result.skipped) }));
      loadBookmarks();
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || t('common.importFailed'));
    }
  } catch {
    toast.error(t('common.importFailed'));
  }
  // Input zurücksetzen für erneuten Import derselben Datei
  if (importJsonInput.value) importJsonInput.value.value = '';
}

// Klick außerhalb Export-Menü
function handleClickOutside(e: MouseEvent) {
  if (exportMenuRef.value && !exportMenuRef.value.contains(e.target as Node)) {
    showExportMenu.value = false;
  }
}

onMounted(() => {
  loadTags();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
