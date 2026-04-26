<template>
  <Teleport to="body">
    <div class="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md animate-slide-up">
        <div class="flex justify-between items-center p-5 pb-0">
          <h2 class="font-semibold text-gray-900 dark:text-white text-base">{{ t('quickEdit.title') }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 p-5">
          <div>
            <label class="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('quickEdit.rating') }}</label>
            <StarRating v-model="form.rating" />
          </div>

          <div>
            <label class="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">{{ t('quickEdit.notes') }}</label>
            <textarea
              v-model="form.notes"
              rows="5"
              :placeholder="t('quickEdit.notesPlaceholder')"
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 focus:border-transparent dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white transition resize-none placeholder-gray-400"
            />
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <button
              type="button"
              @click="$emit('close')"
              class="hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm px-5 py-2 rounded-xl font-medium text-white text-sm transition"
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
import { ref } from "vue";
import { useI18n } from "../composables/useI18n";
import { useToast } from "../composables/useToast";
import StarRating from "./StarRating.vue";

const props = defineProps<{
  bookmark: {
    id: number;
    notes: string | null;
    rating: number | null;
  };
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const { t } = useI18n();
const toast = useToast();

const form = ref({
  notes: props.bookmark.notes || "",
  rating: props.bookmark.rating || null as number | null,
});

const error = ref("");
const loading = ref(false);

async function handleSubmit() {
  error.value = "";
  loading.value = true;

  try {
    const body: Record<string, any> = {};
    if (form.value.notes !== (props.bookmark.notes || "")) {
      body.notes = form.value.notes;
    }
    if (form.value.rating !== props.bookmark.rating) {
      body.rating = form.value.rating;
    }

    // Nur senden wenn sich etwas geändert hat
    if (Object.keys(body).length === 0) {
      emit("close");
      return;
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

    toast.success(t('quickEdit.saved'));
    emit("saved");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
