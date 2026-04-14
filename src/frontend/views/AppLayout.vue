<template>
  <div class="flex bg-gray-50 dark:bg-gray-950 h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 border-gray-200 dark:border-gray-800 border-b h-16 shrink-0">
        <svg class="w-9 h-9 shrink-0" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#3b82f6"/>
          <path d="M8 8h6v2H10v12h4v2H8V8zm10 0h6v16h-6v-2h4V10h-4V8z" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#fbbf24"/>
        </svg>
        <span class="font-bold text-gray-900 dark:text-white text-lg">{{ t('app.name') }}</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <router-link
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {{ t('nav.dashboard') }}
        </router-link>

        <router-link
          to="/bookmarks"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/bookmarks') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {{ t('nav.bookmarks') }}
        </router-link>

        <router-link
          to="/tags"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/tags') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {{ t('nav.tags') }}
        </router-link>

        <router-link
          to="/search"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/search') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {{ t('nav.search') }}
        </router-link>

        <!-- Ordner -->
        <div class="pt-4">
          <div class="flex justify-between items-center mb-2 px-3">
            <span class="font-semibold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">{{ t('nav.folders') }}</span>
            <button
              @click="showNewFolder = true"
              class="text-gray-400 hover:text-primary-500 transition"
              :title="t('folders.newFolder')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- AI Drop Target (beim Draggen oder während AI arbeitet sichtbar) -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2 max-h-0"
            enter-to-class="opacity-100 translate-y-0 max-h-16"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 max-h-16"
            leave-to-class="opacity-0 -translate-y-2 max-h-0"
          >
            <div
              v-if="isDraggingBookmark || aiCreatingFolder"
              @dragover.prevent="onAiDropOver"
              @dragleave="onAiDropLeave"
              @drop.prevent="onAiDrop"
              :class="[
                'flex items-center gap-2 mx-1 mb-1 px-3 py-2 rounded-lg text-sm border-2 border-dashed transition-all overflow-hidden',
                aiCreatingFolder
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500 text-amber-700 dark:text-amber-300 animate-pulse cursor-wait'
                  : aiDropOver
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500 text-amber-700 dark:text-amber-300 scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-pointer'
              ]"
            >
              <span :class="['text-base shrink-0', aiCreatingFolder ? 'animate-bounce' : '']">🤖</span>
              <span class="truncate font-medium">{{ aiCreatingFolder ? t('folders.aiDropCreating') : t('folders.aiDropLabel') }}</span>
              <svg v-if="aiCreatingFolder" class="w-4 h-4 animate-spin shrink-0 ml-auto text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </Transition>

          <!-- AI Sort Drop Target (in bestehenden Ordner einsortieren) -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out delay-75"
            enter-from-class="opacity-0 -translate-y-2 max-h-0"
            enter-to-class="opacity-100 translate-y-0 max-h-16"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0 max-h-16"
            leave-to-class="opacity-0 -translate-y-2 max-h-0"
          >
            <div
              v-if="(isDraggingBookmark || aiSorting) && foldersStore.tree.length"
              @dragover.prevent="onAiSortOver"
              @dragleave="onAiSortLeave"
              @drop.prevent="onAiSortDrop"
              :class="[
                'flex items-center gap-2 mx-1 mb-1 px-3 py-2 rounded-lg text-sm border-2 border-dashed transition-all overflow-hidden',
                aiSorting
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-500 text-primary-700 dark:text-primary-300 animate-pulse cursor-wait'
                  : aiSortOver
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-500 text-primary-700 dark:text-primary-300 scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-pointer'
              ]"
            >
              <span :class="['text-base shrink-0', aiSorting ? 'animate-bounce' : '']">📂</span>
              <span class="truncate font-medium">{{ aiSorting ? t('folders.aiSortWorking') : t('folders.aiSortLabel') }}</span>
              <svg v-if="aiSorting" class="w-4 h-4 animate-spin shrink-0 ml-auto text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </Transition>

          <FolderTree
            v-if="foldersStore.tree.length"
            :folders="foldersStore.tree"
            :active-id="foldersStore.activeFolderId"
            @select="handleFolderSelect"
            @delete-folder="handleDeleteFolder"
            @edit-folder="handleEditFolder"
            @drop-bookmark="handleDropBookmark"
          />
          <p v-else class="px-3 text-gray-400 dark:text-gray-500 text-sm">{{ t('folders.empty') }}</p>
        </div>
      </nav>

      <!-- User-Bereich unten -->
      <div class="p-3 border-gray-200 dark:border-gray-800 border-t shrink-0">
        <router-link
          to="/settings"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/settings') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ t('nav.settings') }}
        </router-link>

        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition"
          :class="isActive('/admin') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {{ t('nav.admin') }}
        </router-link>

        <div class="flex items-center gap-3 mt-1 px-3 py-2.5">
          <div class="flex justify-center items-center bg-primary-100 dark:bg-primary-900/30 rounded-full w-8 h-8 font-semibold text-primary-700 dark:text-primary-400 text-sm">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ authStore.user?.name }}</p>
            <p class="text-gray-500 dark:text-gray-400 text-xs truncate">{{ authStore.user?.email }}</p>
          </div>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-red-500 transition"
            :title="t('auth.logout')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay für Mobile -->
    <div
      v-if="sidebarOpen"
      class="lg:hidden z-30 fixed inset-0 bg-black/30"
      @click="sidebarOpen = false"
    />

    <!-- Hauptinhalt -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- Header -->
      <header class="flex items-center gap-4 bg-white dark:bg-gray-900 px-4 lg:px-6 border-gray-200 dark:border-gray-800 border-b h-16 shrink-0">
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 dark:text-gray-400"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Schnellsuche -->
        <div class="flex-1">
          <SearchBar @search="handleQuickSearch" @add-url="handleQuickAdd" />
        </div>

        <ThemeToggle />
      </header>

      <!-- Seiteninhalt -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>

    <!-- Floating Action Button -->
    <button
      @click="showAddBookmark = true"
      class="right-6 bottom-6 z-50 fixed flex items-center gap-2 bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl px-5 py-3 rounded-2xl font-medium text-white transition-all active:scale-95 group"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span class="hidden sm:inline">{{ t('bookmarks.add') }}</span>
    </button>

    <!-- Modals -->
    <AddBookmarkModal v-if="showAddBookmark" @close="showAddBookmark = false" />
    <NewFolderModal v-if="showNewFolder" @close="showNewFolder = false" />
    <EditFolderModal v-if="editingFolder" :folder="editingFolder" @close="editingFolder = null" @saved="handleFolderSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useFoldersStore } from "../stores/folders";
import { useSettingsStore } from "../stores/settings";
import { useBookmarksStore } from "../stores/bookmarks";
import { useI18n } from "../composables/useI18n";
import { useToast } from "../composables/useToast";
import { useConfirm } from "../composables/useConfirm";
import FolderTree from "../components/FolderTree.vue";
import SearchBar from "../components/SearchBar.vue";
import ThemeToggle from "../components/ThemeToggle.vue";
import AddBookmarkModal from "../components/AddBookmarkModal.vue";
import NewFolderModal from "../components/NewFolderModal.vue";
import EditFolderModal from "../components/EditFolderModal.vue";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const foldersStore = useFoldersStore();
const settingsStore = useSettingsStore();
const bookmarksStore = useBookmarksStore();
const toast = useToast();
const { confirm } = useConfirm();

const sidebarOpen = ref(false);
const showAddBookmark = ref(false);
const showNewFolder = ref(false);
const editingFolder = ref<any>(null);
const isDraggingBookmark = ref(false);
const aiDropOver = ref(false);
const aiCreatingFolder = ref(false);
const aiSortOver = ref(false);
const aiSorting = ref(false);
let dragEnterCount = 0;

const userInitials = computed(() => {
  const name = authStore.user?.name || "";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function handleFolderSelect(folderId: number) {
  foldersStore.activeFolderId = folderId;
  router.push(`/folders/${folderId}`);
  sidebarOpen.value = false;
}

async function handleDropBookmark(data: { bookmarkId: number; folderId: number; folderName: string }) {
  try {
    const res = await fetch(`/api/bookmarks/${data.bookmarkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ folderId: data.folderId }),
    });
    if (res.ok) {
      toast.success(t('bookmarks.movedToFolder', { folder: data.folderName }));
      // Bookmarks neu laden wenn auf der Bookmarks-Seite
      if (route.path === "/bookmarks" || route.path.startsWith("/folders/")) {
        await bookmarksStore.fetchBookmarks();
      }
    }
  } catch {
    toast.error(t('common.saveError'));
  }
}

async function handleDeleteFolder(folder: { id: number; name: string }) {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('folders.deleteConfirm', { name: folder.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger',
  });
  if (!ok) return;

  try {
    await foldersStore.deleteFolder(folder.id);
    toast.success(t('toast.folderDeleted'));
    // Wenn der gelöschte Ordner gerade aktiv war, zur Startseite navigieren
    if (foldersStore.activeFolderId === null && route.path.startsWith('/folders/')) {
      router.push('/bookmarks');
    }
  } catch (e: any) {
    toast.error(e.message || t('toast.deleteFailed'));
  }
}

function handleEditFolder(folder: any) {
  editingFolder.value = folder;
}

function handleFolderSaved() {
  editingFolder.value = null;
  toast.success(t('toast.folderSaved'));
}

function handleQuickSearch(query: string) {
  router.push({ path: "/search", query: { q: query } });
}

// Global Drag-Erkennung: zeigt AI-Drop-Target nur beim Bookmark-Draggen
function onGlobalDragEnter(e: DragEvent) {
  if (e.dataTransfer?.types.includes("application/x-bookmark-id")) {
    dragEnterCount++;
    isDraggingBookmark.value = true;
  }
}

function onGlobalDragLeave() {
  dragEnterCount--;
  if (dragEnterCount <= 0) {
    dragEnterCount = 0;
    isDraggingBookmark.value = false;
    aiDropOver.value = false;
  }
}

function onGlobalDrop() {
  dragEnterCount = 0;
  isDraggingBookmark.value = false;
  aiDropOver.value = false;
  aiSortOver.value = false;
}

function onGlobalDragEnd() {
  dragEnterCount = 0;
  isDraggingBookmark.value = false;
  aiDropOver.value = false;
  aiSortOver.value = false;
}

// AI Drop-Target Handlers
function onAiDropOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes("application/x-bookmark-id")) {
    aiDropOver.value = true;
    event.dataTransfer.dropEffect = "move";
  }
}

function onAiDropLeave() {
  aiDropOver.value = false;
}

async function onAiDrop(event: DragEvent) {
  aiDropOver.value = false;
  const bookmarkId = event.dataTransfer?.getData("application/x-bookmark-id");
  if (!bookmarkId || aiCreatingFolder.value) return;

  aiCreatingFolder.value = true;
  try {
    const res = await fetch(`/api/bookmarks/${bookmarkId}/ai-folder`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const { folder } = await res.json();
      await foldersStore.fetchTree();
      toast.success(t('folders.aiDropSuccess', { folder: folder.name }));
      if (route.path === "/bookmarks" || route.path.startsWith("/folders/")) {
        await bookmarksStore.fetchBookmarks();
      }
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || t('folders.aiDropError'));
    }
  } catch {
    toast.error(t('folders.aiDropError'));
  } finally {
    aiCreatingFolder.value = false;
  }
}

// AI Sort Drop-Target Handlers
function onAiSortOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes("application/x-bookmark-id")) {
    aiSortOver.value = true;
    event.dataTransfer.dropEffect = "move";
  }
}

function onAiSortLeave() {
  aiSortOver.value = false;
}

async function onAiSortDrop(event: DragEvent) {
  aiSortOver.value = false;
  const bookmarkId = event.dataTransfer?.getData("application/x-bookmark-id");
  if (!bookmarkId || aiSorting.value) return;

  aiSorting.value = true;
  try {
    const res = await fetch(`/api/bookmarks/${bookmarkId}/ai-sort`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const { folder } = await res.json();
      toast.success(t('folders.aiSortSuccess', { folder: folder.name }));
      if (route.path === "/bookmarks" || route.path.startsWith("/folders/")) {
        await bookmarksStore.fetchBookmarks();
      }
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || t('folders.aiSortError'));
    }
  } catch {
    toast.error(t('folders.aiSortError'));
  } finally {
    aiSorting.value = false;
  }
}

async function handleQuickAdd(url: string) {
  try {
    await bookmarksStore.createBookmark({ url });
    toast.success(t('searchBar.added'));
    // Wenn auf Bookmarks-Seite → neu laden
    if (route.path === "/bookmarks" || route.path.startsWith("/folders/")) {
      await bookmarksStore.fetchBookmarks();
    }
  } catch (e: any) {
    toast.error(e.message || t('common.saveError'));
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push("/login");
}

onMounted(async () => {
  document.addEventListener("dragenter", onGlobalDragEnter);
  document.addEventListener("dragleave", onGlobalDragLeave);
  document.addEventListener("drop", onGlobalDrop);
  document.addEventListener("dragend", onGlobalDragEnd);

  await Promise.all([
    foldersStore.fetchTree(),
    settingsStore.fetchSettings(),
  ]);
});

onUnmounted(() => {
  document.removeEventListener("dragenter", onGlobalDragEnter);
  document.removeEventListener("dragleave", onGlobalDragLeave);
  document.removeEventListener("drop", onGlobalDrop);
  document.removeEventListener("dragend", onGlobalDragEnd);
});
</script>
