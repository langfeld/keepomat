<template>
  <div class="flex bg-gray-50 dark:bg-gray-950 min-h-screen">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 border-gray-200 dark:border-gray-800 border-b h-16 shrink-0">
        <div class="flex justify-center items-center bg-primary-500 rounded-xl w-9 h-9">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
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

          <FolderTree
            v-if="foldersStore.tree.length"
            :folders="foldersStore.tree"
            :active-id="foldersStore.activeFolderId"
            @select="handleFolderSelect"
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
    <div class="flex flex-col flex-1 min-h-screen">
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
          <SearchBar @search="handleQuickSearch" />
        </div>

        <div class="flex items-center gap-2">
          <ThemeToggle />
          <button
            @click="showAddBookmark = true"
            class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 shadow-sm px-4 py-2 rounded-xl font-medium text-white text-sm transition"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="hidden sm:inline">{{ t('bookmarks.add') }}</span>
          </button>
        </div>
      </header>

      <!-- Seiteninhalt -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>

    <!-- Modals -->
    <AddBookmarkModal v-if="showAddBookmark" @close="showAddBookmark = false" />
    <NewFolderModal v-if="showNewFolder" @close="showNewFolder = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useFoldersStore } from "../stores/folders";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../composables/useI18n";
import FolderTree from "../components/FolderTree.vue";
import SearchBar from "../components/SearchBar.vue";
import ThemeToggle from "../components/ThemeToggle.vue";
import AddBookmarkModal from "../components/AddBookmarkModal.vue";
import NewFolderModal from "../components/NewFolderModal.vue";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const foldersStore = useFoldersStore();
const settingsStore = useSettingsStore();

const sidebarOpen = ref(false);
const showAddBookmark = ref(false);
const showNewFolder = ref(false);

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

function handleQuickSearch(query: string) {
  router.push({ path: "/search", query: { q: query } });
}

async function handleLogout() {
  await authStore.logout();
  router.push("/login");
}

onMounted(async () => {
  await Promise.all([
    foldersStore.fetchTree(),
    settingsStore.fetchSettings(),
  ]);
});
</script>
