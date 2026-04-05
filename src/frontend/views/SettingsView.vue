<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">Einstellungen</h1>

    <div class="space-y-6 max-w-2xl">
      <!-- Allgemein -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">Allgemein</h2>

        <div class="space-y-4">
          <!-- Theme -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Design</label>
            <div class="flex gap-2">
              <button
                v-for="t in themes"
                :key="t.value"
                @click="updateTheme(t.value)"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.theme === t.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                <span v-html="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Sprache -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Sprache</label>
            <select
              v-model="language"
              @change="saveSetting('language', language)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <!-- Ordnermodus -->
          <div>
            <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Ordner-Zuweisung</label>
            <div class="flex gap-2">
              <button
                @click="saveSetting('folderMode', 'single')"
                :class="[
                  'px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.folderMode === 'single'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                Einzelner Ordner
              </button>
              <button
                @click="saveSetting('folderMode', 'multi')"
                :class="[
                  'px-4 py-2 rounded-xl border text-sm font-medium transition',
                  settingsStore.settings?.folderMode === 'multi'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                Mehrere Ordner
              </button>
            </div>
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">
              {{ settingsStore.settings?.folderMode === 'multi' ? 'Ein Lesezeichen kann in mehreren Ordnern sein.' : 'Jedes Lesezeichen gehört zu genau einem Ordner.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- API-Schlüssel -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">API-Schlüssel</h2>
          <button
            @click="createApiKey"
            class="bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg font-medium text-white text-sm transition"
          >
            Neuer Schlüssel
          </button>
        </div>

        <!-- Neuer Schlüssel anzeigen -->
        <div v-if="newApiKey" class="bg-green-50 dark:bg-green-900/20 mb-4 p-4 border border-green-200 dark:border-green-800 rounded-xl">
          <p class="mb-2 font-medium text-green-700 dark:text-green-400 text-sm">Neuer API-Schlüssel erstellt! Diesen jetzt kopieren – er wird nicht erneut angezeigt.</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-green-100 dark:bg-green-900/40 px-3 py-2 rounded-lg font-mono text-green-800 dark:text-green-300 text-sm break-all">{{ newApiKey }}</code>
            <button @click="copyKey" class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-white text-sm transition">
              Kopieren
            </button>
          </div>
        </div>

        <div v-if="apiKeys.length" class="space-y-2">
          <div
            v-for="key in apiKeys"
            :key="key.id"
            class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ key.name }}</p>
              <p class="text-gray-400 text-xs">Erstellt: {{ formatDate(key.createdAt) }}</p>
            </div>
            <button
              @click="deleteApiKey(key.id)"
              class="p-1 text-red-500 hover:text-red-700 transition"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p v-else class="text-gray-400 dark:text-gray-500 text-sm">Keine API-Schlüssel vorhanden.</p>
      </div>

      <!-- Telegram -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">Telegram-Verknüpfung</h2>
        <p class="mb-4 text-gray-500 dark:text-gray-400 text-sm">
          Verknüpfe deinen Telegram-Account, um Links direkt per Chat zu speichern.
        </p>
        <div v-if="telegramLinked" class="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800 rounded-xl">
          <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-green-700 dark:text-green-400 text-sm">Telegram verknüpft</span>
        </div>
        <p v-else class="text-gray-400 text-sm">
          Schreibe <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">/start</code> an den Keepomat-Bot in Telegram.
        </p>
      </div>

      <!-- Import/Export Einstellungen -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">Einstellungen Import/Export</h2>
        <div class="flex gap-3">
          <button
            @click="exportSettings"
            class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
          >
            Exportieren
          </button>
          <label class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition cursor-pointer">
            Importieren
            <input type="file" accept=".json" class="hidden" @change="importSettings" />
          </label>
        </div>
      </div>

      <!-- Gespeichert-Meldung -->
      <div v-if="saved" class="right-6 bottom-6 z-50 fixed bg-green-600 shadow-lg px-4 py-2.5 rounded-xl font-medium text-white text-sm animate-slide-up">
        Einstellungen gespeichert ✓
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();

const language = ref("de");
const apiKeys = ref<any[]>([]);
const newApiKey = ref("");
const telegramLinked = ref(false);
const saved = ref(false);

const themes = [
  { value: "light", label: "Hell", icon: "☀️" },
  { value: "dark", label: "Dunkel", icon: "🌙" },
  { value: "system", label: "System", icon: "💻" },
];

onMounted(async () => {
  await settingsStore.fetchSettings();
  language.value = settingsStore.settings?.language || "de";
  await loadApiKeys();
});

function updateTheme(theme: string) {
  saveSetting("theme", theme);
  settingsStore.applyTheme();
}

async function saveSetting(key: string, value: string) {
  await settingsStore.updateSettings({ [key]: value });
  showSaved();
}

function showSaved() {
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

async function loadApiKeys() {
  try {
    const res = await fetch("/api/keys");
    if (res.ok) apiKeys.value = await res.json();
  } catch {}
}

async function createApiKey() {
  const name = prompt("Name für den API-Schlüssel:");
  if (!name) return;

  try {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      newApiKey.value = data.key;
      await loadApiKeys();
    }
  } catch {}
}

async function deleteApiKey(id: string) {
  if (!confirm("API-Schlüssel wirklich löschen?")) return;
  try {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    await loadApiKeys();
    if (newApiKey.value) newApiKey.value = "";
  } catch {}
}

function copyKey() {
  navigator.clipboard.writeText(newApiKey.value);
}

async function exportSettings() {
  try {
    const res = await fetch("/api/settings/export");
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keepomat-settings.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch {}
}

async function importSettings(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const res = await fetch("/api/settings/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await settingsStore.fetchSettings();
      showSaved();
    }
  } catch {
    alert("Import fehlgeschlagen");
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE");
}
</script>
