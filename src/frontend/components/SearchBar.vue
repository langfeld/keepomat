<template>
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <svg class="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="t('searchBar.placeholder')"
        class="bg-gray-50 dark:bg-gray-800 py-2 pr-4 pl-10 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-sm transition placeholder-gray-400"
        @keydown.enter="handleSearch"
        @input="debouncedSearch"
      />
      <kbd
        v-if="!query"
        class="hidden sm:inline-flex top-1/2 right-3 absolute items-center bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-gray-400 text-xs -translate-y-1/2"
      >
        /
      </kbd>
    </div>

    <!-- Lesezeichen-speichern-Button (nur bei URL-Eingabe) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-90 -translate-x-2"
      enter-to-class="opacity-100 scale-100 translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-x-0"
      leave-to-class="opacity-0 scale-90 -translate-x-2"
    >
      <button
        v-if="isUrl"
        @click="handleAdd"
        :disabled="adding"
        :title="t('searchBar.addHint')"
        class="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-3 py-2 rounded-xl font-medium text-white text-sm whitespace-nowrap transition shrink-0"
      >
        <svg v-if="adding" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="hidden md:inline">{{ t('searchBar.addHint') }}</span>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const emit = defineEmits(["search", "addUrl"]);
const query = ref("");
const adding = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// URL-Erkennung: mit Protokoll, oder domain-artige Muster (z.B. example.com, sub.domain.org/path)
const urlPattern = /^(https?:\/\/\S+|(\S+\.)+[a-z]{2,}(\/\S*)?)$/i;

const isUrl = computed(() => {
  const val = query.value.trim();
  if (!val) return false;
  return urlPattern.test(val);
});

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

let timer: ReturnType<typeof setTimeout>;

function debouncedSearch() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (query.value.trim()) {
      emit("search", query.value.trim());
    }
  }, 500);
}

function handleSearch() {
  clearTimeout(timer);
  const val = query.value.trim();
  if (!val) return;
  emit("search", val);
}

function handleAdd() {
  const val = query.value.trim();
  if (!val || !isUrl.value) return;
  adding.value = true;
  emit("addUrl", normalizeUrl(val));
  query.value = "";
  adding.value = false;
}

function handleKeyboard(e: KeyboardEvent) {
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
    e.preventDefault();
    inputRef.value?.focus();
  }
}

onMounted(() => document.addEventListener("keydown", handleKeyboard));
onUnmounted(() => document.removeEventListener("keydown", handleKeyboard));
</script>
