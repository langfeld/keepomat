<template>
  <div class="flex items-center" :class="{ 'gap-0.5': size === 'sm', 'gap-1': size === 'md' }">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      @click="handleClick(n)"
      @mouseenter="hovered = n"
      @mouseleave="hovered = 0"
      :disabled="readonly"
      :class="[
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
        'transition'
      ]"
    >
      <svg
        :class="[
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5',
          starClass(n)
        ]"
        viewBox="0 0 24 24"
        :fill="isFilled(n) ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
    <span v-if="showValue && modelValue" class="ml-1 text-amber-500 text-xs font-medium">{{ modelValue }}/5</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  readonly?: boolean;
  size?: "sm" | "md";
  showValue?: boolean;
}>(), {
  modelValue: null,
  readonly: false,
  size: "md",
  showValue: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number | null): void;
}>();

const hovered = ref(0);

function isFilled(n: number): boolean {
  const val = hovered.value || props.modelValue || 0;
  return n <= val;
}

function starClass(n: number): string {
  const filled = isFilled(n);
  if (filled) return "text-amber-400";
  return "text-gray-300 dark:text-gray-600";
}

function handleClick(n: number) {
  if (props.readonly) return;
  // Toggle off if clicking the same star
  if (props.modelValue === n) {
    emit("update:modelValue", null);
  } else {
    emit("update:modelValue", n);
  }
}
</script>
