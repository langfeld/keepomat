<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSettingsStore } from "./stores/settings";

const settingsStore = useSettingsStore();

onMounted(() => {
  settingsStore.applyTheme();
});
</script>
