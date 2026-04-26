<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div class="flex justify-between items-center p-6 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('editBookmark.title') }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-6">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.url') }}</label>
            <input
              v-model="form.url"
              type="url"
              required
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.titleLabel') }}</label>
            <input
              v-model="form.title"
              type="text"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.description') }}</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition resize-none"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.notes') }}</label>
            <textarea
              v-model="form.notes"
              rows="3"
              :placeholder="t('editBookmark.notesPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition resize-none placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.rating') }}</label>
            <StarRating v-model="form.rating" />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.tags') }}</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="web, tools, dev"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.folder') }}</label>
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
                :allow-create="true"
                @update:model-value="addFolderById"
                @create="handleCreateFolderMulti"
              />
            </div>

            <!-- Single-Folder-Modus -->
            <SearchableSelect
              v-else
              :model-value="selectedFolderId"
              :options="allFolderOptions"
              :placeholder="t('common.noFolder')"
              :allow-create="true"
              @update:model-value="selectedFolderId = String($event)"
              @create="handleCreateFolderSingle"
            />
          </div>

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isFavorite" type="checkbox" class="border-gray-300 rounded focus:ring-primary-500 w-4 h-4 text-primary-600" />
              <span class="text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.favorite') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isRead" type="checkbox" class="border-gray-300 rounded focus:ring-primary-500 w-4 h-4 text-primary-600" />
              <span class="text-gray-700 dark:text-gray-300 text-sm">{{ t('editBookmark.read') }}</span>
            </label>
          </div>

          <!-- AI-Zusammenfassung -->
          <div v-if="form.aiSummary" class="bg-primary-50/50 dark:bg-primary-900/10 p-3 rounded-xl">
            <p class="mb-1 font-medium text-gray-500 dark:text-gray-400 text-xs">{{ t('editBookmark.aiSummary') }}</p>
            <p class="text-gray-700 dark:text-gray-300 text-sm">{{ form.aiSummary }}</p>
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
              class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-6 py-2.5 rounded-xl font-medium text-white text-sm transition"
            >
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
import { useFoldersStore } from "../stores/folders";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../composables/useI18n";
import { useToast } from "../composables/useToast";
import SearchableSelect from "./SearchableSelect.vue";
import StarRating from "./StarRating.vue";
import type { SelectOption } from "./SearchableSelect.vue";

const props = defineProps<{ bookmark: any }>();
const emit = defineEmits(["close", "saved"]);
const foldersStore = useFoldersStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const toast = useToast();

const isMultiFolder = computed(() => settingsStore.settings.folderMode === "multi");

const form = ref({
  url: props.bookmark.url || "",
  title: props.bookmark.title || "",
  description: props.bookmark.description || "",
  isFavorite: !!props.bookmark.isFavorite,
  isRead: !!props.bookmark.isRead,
  aiSummary: props.bookmark.aiSummary || "",
  notes: props.bookmark.notes || "",
  rating: props.bookmark.rating || null as number | null,
});

const tagsInput = ref(
  (props.bookmark.tags || []).map((t: any) => t.name).join(", ")
);
const selectedFolderId = ref(
  props.bookmark.folders?.[0]?.id || ""
);
const selectedFolderIds = ref<number[]>(
  (props.bookmark.folders || []).map((f: any) => f.id)
);
const error = ref("");
const loading = ref(false);

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
    if (f.children?.length) result.push(...flattenFolders(f.children, depth + 1));
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

async function handleCreateFolderMulti(name: string) {
  try {
    const res = await foldersStore.createFolder(name);
    flatFolders.value = flattenFolders(foldersStore.tree);
    const newId = res?.id || flatFolders.value.find((f) => f.name === name)?.id;
    if (newId && !selectedFolderIds.value.includes(newId)) {
      selectedFolderIds.value.push(newId);
    }
    toast.success(t('toast.folderCreated'));
  } catch (e: any) {
    toast.error(e.message || t('newFolder.createError'));
  }
}

async function handleCreateFolderSingle(name: string) {
  try {
    const res = await foldersStore.createFolder(name);
    flatFolders.value = flattenFolders(foldersStore.tree);
    const newId = res?.id || flatFolders.value.find((f) => f.name === name)?.id;
    if (newId) {
      selectedFolderId.value = String(newId);
    }
    toast.success(t('toast.folderCreated'));
  } catch (e: any) {
    toast.error(e.message || t('newFolder.createError'));
  }
}

onMounted(() => {
  if (!foldersStore.tree.length) foldersStore.fetchTree();
  flatFolders.value = flattenFolders(foldersStore.tree);
});

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    const tags = tagsInput.value
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);

    const body: Record<string, any> = {
      url: form.value.url,
      title: form.value.title,
      description: form.value.description,
      isFavorite: form.value.isFavorite,
      isRead: form.value.isRead,
      notes: form.value.notes,
      rating: form.value.rating,
      tags,
    };

    if (isMultiFolder.value) {
      body.folderIds = selectedFolderIds.value;
    } else {
      body.folderIds = selectedFolderId.value ? [selectedFolderId.value] : [];
    }

    const res = await fetch(`/api/bookmarks/${props.bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t('common.saveError'));
    }

    emit("saved");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
