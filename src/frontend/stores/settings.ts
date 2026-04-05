import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { UserSettings } from "../../shared/types";

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<UserSettings>({
    userId: "",
    theme: "system",
    folderMode: "single",
    language: "de",
    defaultFolderId: null,
  });
  const loading = ref(false);

  async function fetchSettings() {
    loading.value = true;
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      if (res.ok) {
        settings.value = await res.json();
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(data: Partial<UserSettings>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Fehler beim Speichern");
    settings.value = { ...settings.value, ...data };
    applyTheme();
  }

  function applyTheme() {
    const theme = settings.value.theme;
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }

  // Auf System-Theme-Änderungen reagieren
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (settings.value.theme === "system") {
          applyTheme();
        }
      });
  }

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings,
    applyTheme,
  };
}, {
  persist: {
    pick: ["settings"],
  },
});
