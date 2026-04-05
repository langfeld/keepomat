<template>
  <div
    :class="[
      'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition hover:shadow-md group',
      compact ? 'flex items-center gap-4 p-4' : 'flex flex-col'
    ]"
  >
    <!-- Bild (Grid-Ansicht): Screenshot oder OG-Image -->
    <div v-if="!compact && displayImage" class="relative bg-gray-100 dark:bg-gray-800 h-40 overflow-hidden">
      <img
        :src="displayImage"
        :alt="bookmark.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-if="imgError" class="absolute inset-0 flex justify-center items-center bg-gray-100 dark:bg-gray-800">
        <svg class="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <!-- Screenshot-Badge -->
      <div v-if="showScreenshot && bookmark.screenshot" class="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs">
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
        {{ t('bookmark.screenshot') }}
      </div>
    </div>

    <!-- Favicon / Screenshot-Thumbnail (Kompakt-Ansicht) -->
    <div v-if="compact && showScreenshot && screenshotUrl" class="bg-gray-100 dark:bg-gray-800 rounded-xl w-16 h-10 overflow-hidden shrink-0">
      <img
        :src="screenshotUrl"
        :alt="bookmark.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <div v-else-if="compact" class="flex justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-xl w-10 h-10 overflow-hidden shrink-0">
      <img
        v-if="bookmark.favicon"
        :src="bookmark.favicon"
        class="w-6 h-6 object-contain"
        @error="(e: any) => e.target.style.display = 'none'"
      />
      <svg v-else class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </div>

    <!-- Inhalt -->
    <div :class="compact ? 'flex-1 min-w-0' : 'p-4 flex-1'">
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <a
            :href="bookmark.url"
            target="_blank"
            rel="noopener"
            class="font-medium text-gray-900 hover:text-primary-600 dark:hover:text-primary-400 dark:text-white text-sm line-clamp-1 transition"
            @click="markAsRead"
          >
            {{ bookmark.title || bookmark.url }}
          </a>
          <p v-if="!compact && bookmark.description" class="mt-1 text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
            {{ bookmark.description }}
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-1.5">
            <span class="max-w-50 text-gray-400 dark:text-gray-500 text-xs truncate">{{ hostname }}</span>
            <span v-if="bookmark.isDeadLink" class="inline-flex items-center gap-1 text-red-500 text-xs" :title="t('bookmark.deadLink')">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ t('bookmark.dead') }}
            </span>
            <span
              v-for="tag in (bookmark.tags || []).slice(0, 3)"
              :key="tag.id"
              class="inline-flex bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-md text-primary-600 dark:text-primary-400 text-xs"
            >
              {{ tag.name }}
            </span>
            <span v-if="(bookmark.tags || []).length > 3" class="text-gray-400 text-xs">
              +{{ bookmark.tags.length - 3 }}
            </span>
          </div>
        </div>

        <!-- Aktionen -->
        <div class="flex items-center gap-0.5 shrink-0">
          <button
            @click="$emit('toggleFavorite', bookmark)"
            :class="bookmark.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'"
            class="p-1.5 rounded-lg transition"
            :title="t('bookmark.favorite')"
          >
            <svg class="w-4 h-4" :fill="bookmark.isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            @click="$emit('toggleRead', bookmark)"
            :class="bookmark.isRead ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-green-500'"
            class="p-1.5 rounded-lg transition"
            :title="bookmark.isRead ? t('bookmark.markUnread') : t('bookmark.markRead')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            @click="$emit('retakeScreenshot', bookmark)"
            class="p-1.5 rounded-lg text-gray-300 hover:text-primary-500 dark:text-gray-600 transition"
            :title="t('bookmark.retakeScreenshot')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            @click="$emit('edit', bookmark)"
            class="p-1.5 rounded-lg text-gray-300 hover:text-primary-500 dark:text-gray-600 transition"
            :title="t('common.edit')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click="$emit('delete', bookmark.id)"
            class="p-1.5 rounded-lg text-gray-300 hover:text-red-500 dark:text-gray-600 transition"
            :title="t('common.delete')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- AI-Zusammenfassung (Grid-Ansicht) -->
      <div v-if="!compact && bookmark.aiSummary" class="bg-primary-50/50 dark:bg-primary-900/10 mt-3 p-3 rounded-xl">
        <p class="flex items-center gap-1 mb-1 text-gray-600 dark:text-gray-400 text-xs">
          <svg class="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
          </svg>
          {{ t('bookmark.aiSummary') }}
        </p>
        <p class="text-gray-600 dark:text-gray-400 text-xs line-clamp-3">{{ bookmark.aiSummary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const props = defineProps<{
  bookmark: any;
  compact?: boolean;
  highlight?: string;
  showScreenshot?: boolean;
}>();

const emit = defineEmits(["edit", "delete", "toggleFavorite", "toggleRead", "retakeScreenshot"]);

const imgError = ref(false);

const screenshotUrl = computed(() => {
  if (props.bookmark.screenshot) {
    return `/api/bookmarks/${props.bookmark.id}/screenshot`;
  }
  return null;
});

const displayImage = computed(() => {
  if (props.showScreenshot && screenshotUrl.value) {
    return screenshotUrl.value;
  }
  return props.bookmark.ogImage || null;
});

const hostname = computed(() => {
  try {
    return new URL(props.bookmark.url).hostname;
  } catch {
    return props.bookmark.url;
  }
});

async function markAsRead() {
  if (!props.bookmark.isRead) {
    try {
      await fetch(`/api/bookmarks/${props.bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch {}
  }
}
</script>
