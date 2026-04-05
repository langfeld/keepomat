<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg animate-slide-up">
        <div class="flex justify-between items-center p-6 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('addBookmark.title') }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-6">
          <!-- URL (immer sichtbar) -->
          <div>
            <input
              v-model="url"
              type="url"
              required
              :placeholder="t('addBookmark.urlPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
              autofocus
            />
          </div>

          <!-- Ausklappbare Details -->
          <button
            type="button"
            @click="showDetails = !showDetails"
            class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition"
          >
            <svg
              class="w-4 h-4 transition-transform"
              :class="showDetails ? 'rotate-90' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            {{ t('addBookmark.details') }}
          </button>

          <div v-if="showDetails" class="space-y-4 animate-fade-in">
            <!-- Titel -->
            <div>
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('addBookmark.titleLabel') }}</label>
              <input
                v-model="title"
                type="text"
                :placeholder="t('addBookmark.titlePlaceholder')"
                class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
              />
            </div>

            <!-- Ordner -->
            <div>
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('addBookmark.folder') }}</label>
              <!-- Multi-Folder-Modus -->
              <div v-if="isMultiFolder" class="space-y-2">
                <div v-if="selectedFolderIds.length" class="flex flex-wrap gap-1.5">
                  <span
                    v-for="id in selectedFolderIds"
                    :key="id"
                    class="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg text-primary-700 dark:text-primary-300 text-sm"
                  >
                    {{ getFolderName(id) }}
                    <button type="button" @click="removeFolder(id)" class="hover:text-primary-900 dark:hover:text-primary-100">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
                <SearchableSelect
                  :model-value="''"
                  :options="availableFolderOptions"
                  :placeholder="t('addBookmark.addFolder')"
                  @update:model-value="addFolderById"
                />
              </div>

              <!-- Single-Folder-Modus -->
              <SearchableSelect
                v-else
                :model-value="singleFolderId"
                :options="allFolderOptions"
                :placeholder="t('common.noFolder')"
                @update:model-value="singleFolderId = String($event)"
              />
            </div>

            <!-- Tags -->
            <div>
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('addBookmark.tags') }}</label>
              <input
                v-model="tagsInput"
                type="text"
                :placeholder="t('addBookmark.tagsPlaceholder')"
                class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
              />
            </div>
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="$emit('close')"
              class="hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-6 py-2.5 rounded-xl font-medium text-white text-sm transition"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ loading ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBookmarksStore } from "../stores/bookmarks";
import { useFoldersStore } from "../stores/folders";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../composables/useI18n";
import SearchableSelect from "./SearchableSelect.vue";
import type { SelectOption } from "./SearchableSelect.vue";

const emit = defineEmits(["close"]);
const bookmarksStore = useBookmarksStore();
const foldersStore = useFoldersStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();

const url = ref("");
const title = ref("");
const singleFolderId = ref("");
const selectedFolderIds = ref<number[]>([]);
const tagsInput = ref("");
const error = ref("");
const loading = ref(false);
const showDetails = ref(false);

const isMultiFolder = computed(() => settingsStore.settings.folderMode === "multi");

interface FlatFolder {
  id: number;
  name: string;
  depth: number;
}

const flatFolders = ref<FlatFolder[]>([]);

const availableFolders = computed(() =>
  flatFolders.value.filter((f) => !selectedFolderIds.value.includes(f.id))
);

function flattenFolders(folders: any[], depth = 0): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth });
    if (f.children?.length) {
      result.push(...flattenFolders(f.children, depth + 1));
    }
  }
  return result;
}

function getFolderName(id: number): string {
  return flatFolders.value.find((f) => f.id === id)?.name || String(id);
}

function folderToOption(f: FlatFolder): SelectOption {
  return {
    value: f.id,
    label: f.name,
    displayHtml: '\u00A0\u00A0'.repeat(f.depth) + f.name,
  };
}

const allFolderOptions = computed<SelectOption[]>(() =>
  flatFolders.value.map(folderToOption)
);

const availableFolderOptions = computed<SelectOption[]>(() =>
  availableFolders.value.map(folderToOption)
);

function addFolderById(val: string | number) {
  const id = typeof val === "string" ? parseInt(val) : val;
  if (id && !selectedFolderIds.value.includes(id)) {
    selectedFolderIds.value.push(id);
  }
}

function addFolder(e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value);
  if (val && !selectedFolderIds.value.includes(val)) {
    selectedFolderIds.value.push(val);
  }
  (e.target as HTMLSelectElement).value = "";
}

function removeFolder(id: number) {
  selectedFolderIds.value = selectedFolderIds.value.filter((fid) => fid !== id);
}

onMounted(async () => {
  if (!foldersStore.tree.length) await foldersStore.fetchTree();
  flatFolders.value = flattenFolders(foldersStore.tree);

  if (foldersStore.activeFolderId) {
    if (isMultiFolder.value) {
      selectedFolderIds.value = [foldersStore.activeFolderId];
    } else {
      singleFolderId.value = String(foldersStore.activeFolderId);
    }
  }
});

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body: Record<string, any> = { url: url.value };
    if (title.value) body.title = title.value;
    if (tags.length) body.tags = tags;

    if (isMultiFolder.value) {
      if (selectedFolderIds.value.length) body.folderIds = selectedFolderIds.value;
    } else {
      if (singleFolderId.value) body.folderIds = [parseInt(singleFolderId.value)];
    }

    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t('common.saveError'));
    }

    await bookmarksStore.fetchBookmarks({});
    emit("close");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
