<template>
  <div class="p-6 lg:p-8 animate-fade-in">
    <!-- Header -->
    <div class="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 class="font-bold text-gray-900 dark:text-white text-2xl">{{ t('tags.title') }}</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400 text-sm">
          {{ t('tags.count', { count: tags.length }) }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Sortierung -->
        <select
          v-model="sortBy"
          class="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white text-sm"
        >
          <option value="name">{{ t('tags.sortName') }}</option>
          <option value="count">{{ t('tags.sortCount') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <svg class="w-8 h-8 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Tags Grid -->
    <div v-else-if="sortedTags.length" class="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="tag in sortedTags"
        :key="tag.id"
        class="group relative bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl transition hover:shadow-md"
      >
        <!-- Tag-Inhalt (klickbar → Bookmarks filtern) -->
        <router-link
          :to="{ name: 'bookmarks', query: { tag: String(tag.id) } }"
          class="block"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex justify-center items-center rounded-xl w-10 h-10 shrink-0"
              :class="tag.color ? '' : 'bg-primary-100 dark:bg-primary-900/30'"
              :style="tag.color ? { backgroundColor: tag.color + '20' } : {}"
            >
              <svg
                class="w-5 h-5"
                :class="tag.color ? '' : 'text-primary-600 dark:text-primary-400'"
                :style="tag.color ? { color: tag.color } : {}"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{ tag.name }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                {{ t('tags.bookmarkCount', { count: tag.count }) }}
              </p>
            </div>
          </div>
        </router-link>

        <!-- Aktionen (hover) -->
        <div class="top-3 right-3 absolute flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="startEdit(tag)"
            class="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition"
            :title="t('common.edit')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click="handleDelete(tag)"
            class="bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
            :title="t('common.delete')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Leer-State -->
    <div v-else class="bg-white dark:bg-gray-900 p-12 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
      <svg class="mx-auto mb-4 w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t('tags.empty') }}</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-sm">{{ t('tags.emptyHint') }}</p>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editingTag" class="z-50 fixed inset-0 flex justify-center items-center p-4 bg-black/50" @click.self="editingTag = null">
        <div class="bg-white dark:bg-gray-900 shadow-xl p-6 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md animate-fade-in">
          <h2 class="mb-4 font-bold text-gray-900 dark:text-white text-lg">{{ t('tags.editTitle') }}</h2>

          <form @submit.prevent="saveEdit" class="space-y-4">
            <div>
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('tags.name') }}</label>
              <input
                v-model="editName"
                type="text"
                class="bg-gray-50 dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-sm"
                required
              />
            </div>

            <div>
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('tags.color') }}</label>
              <div class="flex items-center gap-3">
                <input
                  v-model="editColor"
                  type="color"
                  class="border-0 rounded w-10 h-10 cursor-pointer"
                />
                <button
                  v-if="editColor"
                  type="button"
                  @click="editColor = ''"
                  class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >{{ t('tags.removeColor') }}</button>
              </div>
            </div>

            <!-- Merge -->
            <div v-if="tags.length > 1">
              <label class="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('tags.mergeInto') }}</label>
              <select
                v-model="mergeTargetId"
                class="bg-gray-50 dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-sm"
              >
                <option value="">{{ t('tags.noMerge') }}</option>
                <option v-for="t2 in tags.filter(tg => tg.id !== editingTag!.id)" :key="t2.id" :value="t2.id">
                  {{ t2.name }} ({{ t2.count }})
                </option>
              </select>
              <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">{{ t('tags.mergeHint') }}</p>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="editingTag = null"
                class="hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
              >{{ t('common.cancel') }}</button>
              <button
                type="submit"
                :disabled="saving"
                class="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2 rounded-xl font-medium text-white text-sm transition"
              >{{ saving ? t('common.saving') : t('common.save') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "../composables/useI18n";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import { useLocalStorage } from "../composables/useLocalStorage";
import type { Tag } from "../../shared/types";

interface TagWithCount extends Tag {
  count: number;
}

const { t } = useI18n();
const { confirm } = useConfirm();
const toast = useToast();

const tags = ref<TagWithCount[]>([]);
const loading = ref(false);
const sortBy = useLocalStorage<"name" | "count">("tagSort", "name");
const editingTag = ref<TagWithCount | null>(null);
const editName = ref("");
const editColor = ref("");
const mergeTargetId = ref<number | "">("");
const saving = ref(false);

const sortedTags = computed(() => {
  const sorted = [...tags.value];
  if (sortBy.value === "count") {
    sorted.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
});

async function fetchTags() {
  loading.value = true;
  try {
    const res = await fetch("/api/tags", { credentials: "include" });
    if (!res.ok) throw new Error("Fehler");
    tags.value = await res.json();
  } finally {
    loading.value = false;
  }
}

function startEdit(tag: TagWithCount) {
  editingTag.value = tag;
  editName.value = tag.name;
  editColor.value = tag.color || "";
  mergeTargetId.value = "";
}

async function saveEdit() {
  if (!editingTag.value) return;
  saving.value = true;

  try {
    // Merge?
    if (mergeTargetId.value) {
      const ok = await confirm({
        title: t('tags.mergeConfirmTitle'),
        message: t('tags.mergeConfirmMessage'),
        confirmText: t('tags.mergeAction'),
        variant: "warning",
      });
      if (!ok) { saving.value = false; return; }

      const res = await fetch("/api/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sourceTagId: editingTag.value.id, targetTagId: mergeTargetId.value }),
      });
      if (!res.ok) throw new Error("Merge fehlgeschlagen");
      toast.success(t('tags.merged'));
    } else {
      // Normales Update
      const res = await fetch(`/api/tags/${editingTag.value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName.value.toLowerCase().trim(),
          color: editColor.value || undefined,
        }),
      });
      if (!res.ok) throw new Error("Update fehlgeschlagen");
      toast.success(t('tags.saved'));
    }

    editingTag.value = null;
    await fetchTags();
  } catch {
    toast.error(t('common.saveError'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(tag: TagWithCount) {
  const ok = await confirm({
    title: t('common.delete'),
    message: t('tags.deleteConfirm', { name: tag.name, count: tag.count }),
    confirmText: t('common.delete'),
    variant: "danger",
  });
  if (!ok) return;

  try {
    const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Fehler");
    tags.value = tags.value.filter((tg) => tg.id !== tag.id);
    toast.success(t('tags.deleted'));
  } catch {
    toast.error(t('common.saveError'));
  }
}

onMounted(fetchTags);
</script>
