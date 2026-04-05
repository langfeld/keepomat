<template>
  <router-view />
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSettingsStore } from "./stores/settings";
import ToastContainer from "./components/ToastContainer.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const settingsStore = useSettingsStore();

onMounted(() => {
  settingsStore.applyTheme();
});
</script>
