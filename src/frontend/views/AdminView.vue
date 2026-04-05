<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">Administration</h1>

    <div class="space-y-6">
      <!-- Statistiken -->
      <div class="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.users }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Benutzer</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.bookmarks }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Lesezeichen</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.folders }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Ordner</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.tags }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Tags</p>
        </div>
      </div>

      <!-- Benutzer-Verwaltung -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">Benutzer</h2>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-gray-200 dark:border-gray-700 border-b">
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">Name</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">E-Mail</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">Lesezeichen</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">Rolle</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="border-gray-100 dark:border-gray-800 last:border-0 border-b"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="flex justify-center items-center bg-primary-100 dark:bg-primary-900/30 rounded-full w-8 h-8 font-semibold text-primary-700 dark:text-primary-400 text-xs">
                      {{ getInitials(user.name) }}
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white text-sm">{{ user.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{{ user.email }}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{{ user.bookmarkCount || 0 }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 rounded-lg text-xs font-medium',
                      user.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    ]"
                  >
                    {{ user.role === 'admin' ? 'Admin' : 'Benutzer' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 rounded-lg text-xs font-medium',
                      user.banned ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    ]"
                  >
                    {{ user.banned ? 'Gesperrt' : 'Aktiv' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end items-center gap-1">
                    <button
                      @click="toggleAdmin(user)"
                      :disabled="user.isSelf"
                      :title="user.role === 'admin' ? 'Admin entziehen' : 'Zum Admin machen'"
                      class="hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-30 p-1.5 rounded-lg text-gray-400 hover:text-primary-500 transition"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </button>
                    <button
                      @click="toggleDisable(user)"
                      :disabled="user.isSelf"
                      :title="user.banned ? 'Entsperren' : 'Sperren'"
                      class="hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-30 p-1.5 rounded-lg text-gray-400 hover:text-amber-500 transition"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button
                      @click="deleteUser(user)"
                      :disabled="user.isSelf"
                      title="Löschen"
                      class="hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- System-Einstellungen -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">System-Einstellungen</h2>

        <div class="space-y-4">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Registrierung</label>
            <div class="flex items-center gap-3">
              <button
                @click="updateSystemSetting('registrationEnabled', registrationEnabled ? 'false' : 'true')"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition',
                  registrationEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                    registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
              <span class="text-gray-600 dark:text-gray-400 text-sm">
                {{ registrationEnabled ? 'Aktiviert' : 'Deaktiviert' }}
              </span>
            </div>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">AI-Provider</label>
            <select
              v-model="aiProvider"
              @change="updateSystemSetting('aiProvider', aiProvider)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            >
              <option value="moonshot">Moonshot (Kimi)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (lokal)</option>
            </select>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">AI API-Schlüssel</label>
            <input
              v-model="aiApiKey"
              type="password"
              placeholder="sk-..."
              @blur="updateSystemSetting('aiApiKey', aiApiKey)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">AI Modell</label>
            <input
              v-model="aiModel"
              type="text"
              placeholder="kimi-k2-turbo-preview"
              @blur="updateSystemSetting('aiModel', aiModel)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Gespeichert-Meldung -->
      <div v-if="saved" class="right-6 bottom-6 z-50 fixed bg-green-600 shadow-lg px-4 py-2.5 rounded-xl font-medium text-white text-sm animate-slide-up">
        Gespeichert ✓
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();

const stats = ref({ users: 0, bookmarks: 0, folders: 0, tags: 0 });
const users = ref<any[]>([]);
const saved = ref(false);
const registrationEnabled = ref(true);
const aiProvider = ref("moonshot");
const aiApiKey = ref("");
const aiModel = ref("");

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function loadData() {
  try {
    const [statsRes, usersRes, settingsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/users"),
      fetch("/api/admin/settings"),
    ]);

    if (statsRes.ok) stats.value = await statsRes.json();
    if (usersRes.ok) {
      const data = await usersRes.json();
      users.value = data.map((u: any) => ({
        ...u,
        isSelf: u.id === authStore.user?.id,
      }));
    }
    if (settingsRes.ok) {
      const data = await settingsRes.json();
      registrationEnabled.value = data.registrationEnabled !== "false";
      aiProvider.value = data.aiProvider || "moonshot";
      aiApiKey.value = data.aiApiKey || "";
      aiModel.value = data.aiModel || "";
    }
  } catch (e) {
    console.error("Admin-Daten laden fehlgeschlagen:", e);
  }
}

async function toggleAdmin(user: any) {
  try {
    await fetch(`/api/admin/users/${user.id}/toggle-admin`, { method: "PATCH" });
    await loadData();
  } catch {}
}

async function toggleDisable(user: any) {
  try {
    await fetch(`/api/admin/users/${user.id}/toggle-disable`, { method: "PATCH" });
    await loadData();
  } catch {}
}

async function deleteUser(user: any) {
  if (!confirm(`Benutzer "${user.name}" wirklich löschen? Alle Daten werden entfernt.`)) return;
  try {
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    await loadData();
  } catch {}
}

async function updateSystemSetting(key: string, value: string) {
  try {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (key === "registrationEnabled") registrationEnabled.value = value !== "false";
    showSaved();
  } catch {}
}

function showSaved() {
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

onMounted(loadData);
</script>
