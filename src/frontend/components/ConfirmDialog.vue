<template>
  <Teleport to="body">
    <Transition name="confirm-overlay">
      <div v-if="visible" class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleCancel" />

        <!-- Dialog -->
        <Transition name="confirm-dialog" appear>
          <div
            v-if="visible"
            class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden"
          >
            <!-- Header -->
            <div class="flex items-start gap-3 p-5 pb-2">
              <div
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                  variantIconBg[options.variant || 'danger']
                ]"
              >
                <!-- Danger icon -->
                <svg v-if="options.variant === 'danger' || !options.variant" class="w-5 h-5" :class="variantIconColor[options.variant || 'danger']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <!-- Warning icon -->
                <svg v-else-if="options.variant === 'warning'" class="w-5 h-5" :class="variantIconColor['warning']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <!-- Info icon -->
                <svg v-else class="w-5 h-5" :class="variantIconColor['info']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white text-base">{{ options.title }}</h3>
                <p class="mt-1 text-gray-500 dark:text-gray-400 text-sm">{{ options.message }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 p-5 pt-4">
              <button
                ref="cancelBtn"
                @click="handleCancel"
                class="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {{ options.cancelText || t('common.cancel') }}
              </button>
              <button
                ref="confirmBtn"
                @click="handleConfirm"
                :class="[
                  'px-4 py-2 rounded-xl text-sm font-medium text-white transition',
                  variantButtonClass[options.variant || 'danger']
                ]"
              >
                {{ options.confirmText || t('common.delete') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, ref as vueRef, nextTick } from "vue";
import { useConfirm } from "../composables/useConfirm";
import { useI18n } from "../composables/useI18n";

const { visible, options, handleConfirm, handleCancel } = useConfirm();
const { t } = useI18n();

const cancelBtn = vueRef<HTMLButtonElement>();

// Focus trap: focus cancel button when dialog opens
watch(visible, async (val) => {
  if (val) {
    await nextTick();
    cancelBtn.value?.focus();
  }
});

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && visible.value) {
    handleCancel();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", onKeydown);
}

const variantIconBg: Record<string, string> = {
  danger: "bg-red-100 dark:bg-red-900/30",
  warning: "bg-amber-100 dark:bg-amber-900/30",
  info: "bg-blue-100 dark:bg-blue-900/30",
};

const variantIconColor: Record<string, string> = {
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

const variantButtonClass: Record<string, string> = {
  danger: "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
  warning: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600",
  info: "bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600",
};
</script>

<style scoped>
.confirm-overlay-enter-active,
.confirm-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-overlay-enter-from,
.confirm-overlay-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-active {
  transition: all 0.2s ease-out;
}
.confirm-dialog-leave-active {
  transition: all 0.15s ease-in;
}
.confirm-dialog-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.confirm-dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
