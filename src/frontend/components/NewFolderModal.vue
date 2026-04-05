<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md animate-slide-up">
        <div class="flex justify-between items-center p-6 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">Neuer Ordner</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-6">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Name *</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ordnername"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
              autofocus
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Überordner</label>
            <select
              v-model="parentId"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            >
              <option value="">Kein Überordner (Wurzelebene)</option>
              <option v-for="folder in flatFolders" :key="folder.id" :value="folder.id">
                {{ '  '.repeat(folder.depth) }}{{ folder.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Icon (Emoji)</label>
            <input
              v-model="icon"
              type="text"
              placeholder="📁"
              maxlength="4"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-20 text-gray-900 dark:text-white text-xl text-center transition"
            />
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
              Abbrechen
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-6 py-2.5 rounded-xl font-medium text-white text-sm transition"
            >
              {{ loading ? 'Erstellen...' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useFoldersStore } from "../stores/folders";

const emit = defineEmits(["close"]);
const foldersStore = useFoldersStore();

const name = ref("");
const parentId = ref("");
const icon = ref("");
const error = ref("");
const loading = ref(false);

interface FlatFolder {
  id: number;
  name: string;
  depth: number;
}

const flatFolders = ref<FlatFolder[]>([]);

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
  if (foldersStore.activeFolderId) {
    parentId.value = String(foldersStore.activeFolderId);
  }
});

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    await foldersStore.createFolder(
      name.value,
      parentId.value ? Number(parentId.value) : null
    );
    emit("close");
  } catch (e: any) {
    error.value = e.message || "Fehler beim Erstellen";
  } finally {
    loading.value = false;
  }
}
</script>
