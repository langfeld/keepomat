<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div class="flex justify-between items-center p-6 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-lg">Lesezeichen bearbeiten</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-6">
          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">URL</label>
            <input
              v-model="form.url"
              type="url"
              required
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Titel</label>
            <input
              v-model="form.title"
              type="text"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Beschreibung</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition resize-none"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Tags (kommagetrennt)</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="web, tools, dev"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">Ordner</label>
            <select
              v-model="selectedFolderId"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition"
            >
              <option value="">Kein Ordner</option>
              <option v-for="folder in flatFolders" :key="folder.id" :value="folder.id">
                {{ '  '.repeat(folder.depth) }}{{ folder.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isFavorite" type="checkbox" class="border-gray-300 rounded focus:ring-primary-500 w-4 h-4 text-primary-600" />
              <span class="text-gray-700 dark:text-gray-300 text-sm">Favorit</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isRead" type="checkbox" class="border-gray-300 rounded focus:ring-primary-500 w-4 h-4 text-primary-600" />
              <span class="text-gray-700 dark:text-gray-300 text-sm">Gelesen</span>
            </label>
          </div>

          <!-- AI-Zusammenfassung -->
          <div v-if="form.aiSummary" class="bg-primary-50/50 dark:bg-primary-900/10 p-3 rounded-xl">
            <p class="mb-1 font-medium text-gray-500 dark:text-gray-400 text-xs">AI-Zusammenfassung</p>
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
              Abbrechen
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-6 py-2.5 rounded-xl font-medium text-white text-sm transition"
            >
              {{ loading ? 'Speichern...' : 'Speichern' }}
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

const props = defineProps<{ bookmark: any }>();
const emit = defineEmits(["close", "saved"]);
const foldersStore = useFoldersStore();

const form = ref({
  url: props.bookmark.url || "",
  title: props.bookmark.title || "",
  description: props.bookmark.description || "",
  isFavorite: !!props.bookmark.isFavorite,
  isRead: !!props.bookmark.isRead,
  aiSummary: props.bookmark.aiSummary || "",
});

const tagsInput = ref(
  (props.bookmark.tags || []).map((t: any) => t.name).join(", ")
);
const selectedFolderId = ref(
  props.bookmark.folders?.[0]?.id || ""
);
const error = ref("");
const loading = ref(false);

interface FlatFolder {
  id: string;
  name: string;
  depth: number;
}
const flatFolders = ref<FlatFolder[]>([]);

function flattenFolders(folders: any[], depth = 0): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth });
    if (f.children?.length) result.push(...flattenFolders(f.children, depth + 1));
  }
  return result;
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
      tags,
      folderIds: selectedFolderId.value ? [selectedFolderId.value] : [],
    };

    const res = await fetch(`/api/bookmarks/${props.bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Fehler beim Speichern");
    }

    emit("saved");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
