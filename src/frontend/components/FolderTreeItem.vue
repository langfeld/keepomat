<template>
  <div>
    <button
      @click="handleClick"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      :class="[
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition group',
        dragOver
          ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400 dark:ring-primary-600'
          : folder.id === activeId
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      ]"
      :style="{ paddingLeft: `${depth * 16 + 12}px` }"
    >
      <!-- Expand-Pfeil -->
      <button
        v-if="folder.children?.length"
        @click.stop="expanded = !expanded"
        class="flex justify-center items-center w-4 h-4 shrink-0"
      >
        <svg
          :class="['w-3 h-3 transition-transform', expanded ? 'rotate-90' : '']"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else class="w-4" />

      <!-- Ordner-Icon -->
      <svg class="w-4 h-4 shrink-0" :class="folder.id === activeId ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <span class="flex-1 text-left truncate">{{ folder.name }}</span>

      <!-- Löschen-Button (Hover) -->
      <button
        @click.stop="$emit('delete-folder', folder)"
        class="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition shrink-0"
        :title="t('common.delete')"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <!-- Shared-Icon -->
      <svg v-if="folder.isShared" class="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>

    <!-- Kinder -->
    <div v-if="expanded && folder.children?.length">
      <FolderTreeItem
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :active-id="activeId"
        :depth="depth + 1"
        @select="$emit('select', $event)"
        @delete-folder="$emit('delete-folder', $event)"
        @drop-bookmark="$emit('drop-bookmark', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const props = defineProps<{
  folder: any;
  activeId: number | null;
  depth: number;
}>();

const emit = defineEmits(["select", "delete-folder", "drop-bookmark"]);

const expanded = ref(props.depth < 1);
const dragOver = ref(false);

function handleClick() {
  emit("select", props.folder.id);
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes("application/x-bookmark-id")) {
    dragOver.value = true;
    event.dataTransfer.dropEffect = "move";
  }
}

function onDragLeave() {
  dragOver.value = false;
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  const bookmarkId = event.dataTransfer?.getData("application/x-bookmark-id");
  if (bookmarkId) {
    emit("drop-bookmark", {
      bookmarkId: parseInt(bookmarkId),
      folderId: props.folder.id,
      folderName: props.folder.name,
    });
  }
}
</script>
