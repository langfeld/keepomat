<template>
  <div class="relative">
    <svg class="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      v-model="query"
      type="search"
      :placeholder="t('searchBar.placeholder')"
      class="bg-gray-50 dark:bg-gray-800 py-2 pr-4 pl-10 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-sm transition placeholder-gray-400"
      @keydown.enter="search"
      @input="debouncedSearch"
    />
    <kbd
      v-if="!query"
      class="hidden sm:inline-flex top-1/2 right-3 absolute items-center bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-gray-400 text-xs -translate-y-1/2"
    >
      /
    </kbd>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const emit = defineEmits(["search"]);
const query = ref("");

let timer: ReturnType<typeof setTimeout>;

function debouncedSearch() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (query.value.trim()) {
      emit("search", query.value.trim());
    }
  }, 500);
}

function search() {
  clearTimeout(timer);
  if (query.value.trim()) {
    emit("search", query.value.trim());
  }
}

function handleKeyboard(e: KeyboardEvent) {
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
    e.preventDefault();
    const input = document.querySelector('input[type="search"]') as HTMLInputElement;
    input?.focus();
  }
}

onMounted(() => document.addEventListener("keydown", handleKeyboard));
onUnmounted(() => document.removeEventListener("keydown", handleKeyboard));
</script>
