<template>
  <div class="relative">
    <button
      @click="cycle"
      class="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl text-gray-500 dark:text-gray-400 transition"
      :title="`Design: ${currentLabel}`"
    >
      <!-- Sonne -->
      <svg v-if="current === 'light'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <!-- Mond -->
      <svg v-else-if="current === 'dark'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <!-- System -->
      <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();

const current = computed(() => settingsStore.settings?.theme || "system");

const currentLabel = computed(() => {
  switch (current.value) {
    case "light": return "Hell";
    case "dark": return "Dunkel";
    default: return "System";
  }
});

function cycle() {
  const order = ["light", "dark", "system"];
  const idx = order.indexOf(current.value);
  const next = order[(idx + 1) % order.length] as "light" | "dark" | "system";
  settingsStore.updateSettings({ theme: next });
  settingsStore.applyTheme();
}
</script>
