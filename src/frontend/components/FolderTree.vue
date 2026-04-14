<template>
  <div class="space-y-0.5">
    <FolderTreeItem
      v-for="folder in folders"
      :key="folder.id"
      :folder="folder"
      :active-id="activeId"
      :depth="0"
      @select="$emit('select', $event)"
      @delete-folder="$emit('delete-folder', $event)"
      @edit-folder="$emit('edit-folder', $event)"
      @drop-bookmark="$emit('drop-bookmark', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import FolderTreeItem from "./FolderTreeItem.vue";

defineProps<{
  folders: any[];
  activeId: number | null;
}>();

defineEmits(["select", "delete-folder", "edit-folder", "drop-bookmark"]);
</script>
