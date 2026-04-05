<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <h1 class="mb-6 font-bold text-gray-900 dark:text-white text-2xl">{{ t('admin.title') }}</h1>

    <div class="space-y-6">
      <!-- Statistiken -->
      <div class="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.users }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('admin.users') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.bookmarks }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('admin.bookmarks') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.folders }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('admin.folders') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p class="font-bold text-gray-900 dark:text-white text-2xl">{{ stats.tags }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('admin.tags') }}</p>
        </div>
      </div>

      <!-- Benutzer-Verwaltung -->
      <div class="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">{{ t('admin.users') }}</h2>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-gray-200 dark:border-gray-700 border-b">
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">{{ t('admin.colName') }}</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">{{ t('admin.colEmail') }}</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">{{ t('admin.colBookmarks') }}</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">{{ t('admin.colRole') }}</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-left">{{ t('admin.colStatus') }}</th>
                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-sm text-right">{{ t('admin.colActions') }}</th>
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
                      user.isAdmin ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    ]"
                  >
                    {{ user.isAdmin ? t('admin.roleAdmin') : t('admin.roleUser') }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 rounded-lg text-xs font-medium',
                      user.isDisabled ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    ]"
                  >
                    {{ user.isDisabled ? t('admin.statusBanned') : t('admin.statusActive') }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end items-center gap-1">
                    <button
                      @click="toggleAdmin(user)"
                      :disabled="user.isSelf"
                      :title="user.isAdmin ? t('admin.revokeAdmin') : t('admin.makeAdmin')"
                      class="hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-30 p-1.5 rounded-lg text-gray-400 hover:text-primary-500 transition"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </button>
                    <button
                      @click="toggleDisable(user)"
                      :disabled="user.isSelf"
                      :title="user.isDisabled ? t('admin.unban') : t('admin.ban')"
                      class="hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-30 p-1.5 rounded-lg text-gray-400 hover:text-amber-500 transition"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button
                      @click="deleteUser(user)"
                      :disabled="user.isSelf"
                      :title="t('admin.delete')"
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
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-white text-lg">{{ t('admin.systemSettings') }}</h2>

        <div class="space-y-4">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.registration') }}</label>
            <div class="flex items-center gap-3">
              <button
                @click="updateSystemSetting('registration_enabled', registrationEnabled ? 'false' : 'true')"
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
                {{ registrationEnabled ? t('admin.enabled') : t('admin.disabled') }}
              </span>
            </div>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.aiShared') }}</label>
            <div class="flex items-center gap-3">
              <button
                @click="updateSystemSetting('ai_shared_enabled', aiSharedEnabled ? 'false' : 'true'); aiSharedEnabled = !aiSharedEnabled"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition',
                  aiSharedEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                    aiSharedEnabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
              <span class="text-gray-600 dark:text-gray-400 text-sm">
                {{ aiSharedEnabled ? t('admin.enabled') : t('admin.disabled') }}
              </span>
            </div>
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">{{ t('admin.aiSharedHint') }}</p>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.aiProvider') }}</label>
            <select
              v-model="aiProvider"
              @change="updateSystemSetting('ai_provider', aiProvider)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            >
              <option value="kimi">Moonshot (Kimi)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (lokal)</option>
            </select>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.aiApiKey') }}</label>
            <input
              v-model="aiApiKey"
              type="password"
              placeholder="sk-..."
              @blur="updateSystemSetting('moonshot_api_key', aiApiKey)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.aiModel') }}</label>
            <input
              v-model="aiModel"
              type="text"
              placeholder="kimi-k2-turbo-preview"
              @blur="updateSystemSetting('ai_model', aiModel)"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white"
            />
          </div>

          <!-- AI Thinking Toggle (nur bei Kimi) -->
          <div v-if="aiProvider === 'kimi'">
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('admin.aiThinking') }}</label>
            <div class="flex items-center gap-3">
              <button
                @click="aiThinkingEnabled = !aiThinkingEnabled; updateSystemSetting('ai_thinking_enabled', aiThinkingEnabled ? 'true' : 'false')"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition',
                  aiThinkingEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                    aiThinkingEnabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
              <span class="text-gray-600 dark:text-gray-400 text-sm">
                {{ aiThinkingEnabled ? t('admin.aiThinkingEnabled') : t('admin.aiThinkingDisabled') }}
              </span>
            </div>
            <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">{{ t('admin.aiThinkingHint') }}</p>
          </div>

          <!-- AI Test -->
          <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <button
                @click="testAi"
                :disabled="aiTesting"
                class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
              >
                <svg v-if="aiTesting" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ aiTesting ? t('admin.aiTesting') : t('admin.aiTest') }}
              </button>
              <div v-if="aiTestResult" class="flex items-center gap-2 text-sm">
                <span
                  :class="aiTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ aiTestResult.success ? '✓' : '✗' }}
                  {{ aiTestResult.message }}
                </span>
                <span v-if="aiTestResult.duration" class="text-gray-400 text-xs">
                  ({{ aiTestResult.duration }}ms)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gespeichert-Meldung -->
      <div v-if="saved" class="right-6 bottom-6 z-50 fixed bg-green-600 shadow-lg px-4 py-2.5 rounded-xl font-medium text-white text-sm animate-slide-up">
        {{ t('admin.saved') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";

const authStore = useAuthStore();
const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();

const stats = ref({ users: 0, bookmarks: 0, folders: 0, tags: 0 });
const users = ref<any[]>([]);
const saved = ref(false);
const registrationEnabled = ref(true);
const aiSharedEnabled = ref(true);
const aiProvider = ref("kimi");
const aiApiKey = ref("");
const aiModel = ref("");
const aiThinkingEnabled = ref(false);
const aiTesting = ref(false);
const aiTestResult = ref<{ success: boolean; message: string; duration: number } | null>(null);

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
      registrationEnabled.value = data.registration_enabled !== "false";
      aiSharedEnabled.value = data.ai_shared_enabled !== "false";
      aiProvider.value = data.ai_provider || "kimi";
      aiApiKey.value = data.moonshot_api_key || "";
      aiModel.value = data.ai_model || "";
      aiThinkingEnabled.value = data.ai_thinking_enabled === "true";
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
  const ok = await confirm({
    title: t('common.delete'),
    message: t('admin.deleteUserConfirm', { name: user.name }),
    confirmText: t('common.delete'),
    variant: 'danger',
  });
  if (!ok) return;
  try {
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    await loadData();
    toast.success(t('toast.userDeleted'));
  } catch {
    toast.error(t('common.saveError'));
  }
}

async function updateSystemSetting(key: string, value: string) {
  try {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (key === 'registration_enabled') registrationEnabled.value = value !== "false";
    showSaved();
  } catch {}
}

async function testAi() {
  aiTesting.value = true;
  aiTestResult.value = null;
  try {
    const res = await fetch("/api/admin/ai-test", { method: "POST" });
    aiTestResult.value = await res.json();
  } catch (e: any) {
    aiTestResult.value = { success: false, message: e.message || "Connection failed", duration: 0 };
  } finally {
    aiTesting.value = false;
  }
}

function showSaved() {
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

onMounted(loadData);
</script>
