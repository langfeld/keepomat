<template>
  <div>
    <button
      @click="handleClick"
      :class="[
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition group',
        folder.id === activeId
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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  folder: any;
  activeId: number | null;
  depth: number;
}>();

const emit = defineEmits(["select"]);

const expanded = ref(props.depth < 1);

function handleClick() {
  emit("select", props.folder.id);
}
</script>
