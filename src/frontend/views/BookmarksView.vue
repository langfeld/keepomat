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
        <select
          v-model="filter"
          class="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white text-sm"
        >
          <option value="">{{ t('bookmarks.filterAll') }}</option>
          <option value="unread">{{ t('bookmarks.filterUnread') }}</option>
          <option value="favorites">{{ t('bookmarks.filterFavorites') }}</option>
          <option value="dead">{{ t('bookmarks.filterDead') }}</option>
        </select>

        <!-- Tag-Filter -->
        <select
          v-model="selectedTag"
          class="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white text-sm"
        >
          <option value="">{{ t('bookmarks.filterAllTags') }}</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
        </select>

        <!-- Ansicht -->
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl">
          <button
            @click="viewMode = 'list'"
            :class="viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''"
            class="p-2 rounded-lg transition"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            @click="viewMode = 'grid'"
            :class="viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''"
            class="p-2 rounded-lg transition"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

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
            class="right-0 z-10 absolute bg-white dark:bg-gray-800 shadow-lg mt-2 py-1 border border-gray-200 dark:border-gray-700 rounded-xl w-48"
          >
            <button @click="importBookmarks" class="hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 w-full text-gray-700 dark:text-gray-300 text-sm text-left">
              {{ t('bookmarks.importHtml') }}
            </button>
            <a href="/api/export/html" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportHtml') }}
            </a>
            <a href="/api/export/json" class="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
              {{ t('bookmarks.exportJson') }}
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
        @edit="editBookmark"
        @delete="deleteBookmark"
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

    <!-- Versteckter Import-Input -->
    <input ref="importInput" type="file" accept=".html,.htm" class="hidden" @change="handleImport" />

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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useBookmarksStore } from "../stores/bookmarks";
import { useI18n } from "../composables/useI18n";
import BookmarkCard from "../components/BookmarkCard.vue";
import EditBookmarkModal from "../components/EditBookmarkModal.vue";

const route = useRoute();
const bookmarksStore = useBookmarksStore();
const { t } = useI18n();

const filter = ref("");
const selectedTag = ref("");
const viewMode = ref<"list" | "grid">("list");
const tags = ref<any[]>([]);
const showExportMenu = ref(false);
const exportMenuRef = ref<HTMLElement>();
const importInput = ref<HTMLInputElement>();
const editingBookmark = ref<any>(null);
const currentFolder = ref<any>(null);

// Ordner aus Route
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

watch([filter, selectedTag], () => loadBookmarks());

async function loadBookmarks() {
  const params: Record<string, string> = {};
  if (route.params.folderId) params.folderId = route.params.folderId as string;
  if (selectedTag.value) params.tagId = selectedTag.value;
  if (filter.value === "unread") params.isRead = "false";
  if (filter.value === "favorites") params.isFavorite = "true";
  if (filter.value === "dead") params.isDeadLink = "true";

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
  if (!confirm(t('bookmarks.deleteConfirm'))) return;
  await bookmarksStore.deleteBookmark(id);
}

function handleBookmarkSaved() {
  editingBookmark.value = null;
  loadBookmarks();
}

function importBookmarks() {
  showExportMenu.value = false;
  importInput.value?.click();
}

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/export/import", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const result = await res.json();
      alert(t('bookmarks.importResult', { imported: String(result.imported), skipped: String(result.skipped) }));
      loadBookmarks();
    } else {
      alert(t('common.importFailed'));
    }
  } catch {
    alert(t('common.importFailed'));
  }
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
