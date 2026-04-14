<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md animate-slide-up">
        <div class="flex justify-between items-center p-6 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">{{ t('editFolder.title') }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-6">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editFolder.name') }}</label>
            <input
              v-model="name"
              type="text"
              required
              :placeholder="t('newFolder.namePlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
              autofocus
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editFolder.parent') }}</label>
            <SearchableSelect
              :model-value="parentId"
              :options="folderOptions"
              :placeholder="t('newFolder.noParent')"
              @update:model-value="parentId = String($event)"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('editFolder.icon') }}</label>
            <div class="flex items-center gap-3">
              <input
                v-model="icon"
                type="text"
                placeholder="📁"
                maxlength="4"
                class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-20 text-gray-900 dark:text-white text-xl text-center transition"
              />
              <button
                v-if="icon"
                type="button"
                @click="icon = ''"
                class="text-gray-400 hover:text-red-500 text-sm transition"
              >
                {{ t('editFolder.removeIcon') }}
              </button>
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
import { useI18n } from "../composables/useI18n";
import SearchableSelect from "./SearchableSelect.vue";
import type { SelectOption } from "./SearchableSelect.vue";

const props = defineProps<{
  folder: {
    id: number;
    name: string;
    icon?: string | null;
    parentId?: number | null;
  };
}>();

const emit = defineEmits(["close", "saved"]);
const foldersStore = useFoldersStore();
const { t } = useI18n();

const name = ref(props.folder.name);
const parentId = ref(props.folder.parentId ? String(props.folder.parentId) : "");
const icon = ref(props.folder.icon || "");
const error = ref("");
const loading = ref(false);

interface FlatFolder {
  id: number;
  name: string;
  depth: number;
}

const flatFolders = ref<FlatFolder[]>([]);

const folderOptions = computed<SelectOption[]>(() =>
  flatFolders.value
    .filter((f) => f.id !== props.folder.id) // Sich selbst ausschließen
    .map((f) => ({
      value: f.id,
      label: f.name,
      displayHtml: '\u00A0\u00A0'.repeat(f.depth) + f.name,
    }))
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

onMounted(() => {
  flatFolders.value = flattenFolders(foldersStore.tree);
});

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    await foldersStore.updateFolder(props.folder.id, {
      name: name.value,
      parentId: parentId.value ? Number(parentId.value) : null,
      icon: icon.value || null,
    });
    emit("saved");
    emit("close");
  } catch (e: any) {
    error.value = e.message || t('editFolder.saveError');
  } finally {
    loading.value = false;
  }
}
</script>
