<template>
  <div ref="containerRef" class="relative">
    <!-- Trigger-Button -->
    <button
      type="button"
      @click="toggle"
      :class="triggerClass"
      class="flex justify-between items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 w-full text-left text-gray-900 dark:text-white transition"
    >
      <span :class="modelValue === '' || modelValue === null || modelValue === undefined ? 'text-gray-400' : ''">
        {{ displayLabel }}
      </span>
      <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        class="z-9999 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl w-full min-w-50 overflow-hidden animate-fade-in"
        :style="dropdownStyle"
      >
        <!-- Suchfeld -->
        <div class="p-2 border-b border-gray-200 dark:border-gray-700">
          <input
            ref="searchInputRef"
            v-model="search"
            type="text"
            :placeholder="searchPlaceholder || t('common.search')"
            class="bg-gray-50 dark:bg-gray-900 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 w-full text-gray-900 dark:text-white text-sm placeholder-gray-400"
            @keydown.escape="close"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.down.prevent="moveHighlight(1)"
            @keydown.up.prevent="moveHighlight(-1)"
          />
        </div>

        <!-- Optionen -->
        <ul class="p-1 max-h-48 overflow-y-auto" role="listbox">
          <!-- Platzhalter-Option (z.B. "Kein Ordner") -->
          <li
            v-if="placeholder"
            @click="select('')"
            :class="[
              'px-3 py-2 rounded-lg text-sm cursor-pointer transition',
              highlightIndex === -1
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
              modelValue === '' || modelValue === null || modelValue === undefined ? 'font-medium' : ''
            ]"
            role="option"
          >
            {{ placeholder }}
          </li>

          <li
            v-for="(option, index) in filteredOptions"
            :key="option.value"
            @click="select(option.value)"
            :class="[
              'px-3 py-2 rounded-lg text-sm cursor-pointer transition',
              highlightIndex === index
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
              String(modelValue) === String(option.value) ? 'font-medium bg-primary-50/50 dark:bg-primary-900/20' : ''
            ]"
            role="option"
          >
            <span>{{ option.label }}</span>
          </li>

          <!-- Keine Ergebnisse -->
          <li v-if="!filteredOptions.length" class="px-3 py-2 text-gray-400 dark:text-gray-500 text-sm">
            {{ t('common.noResults') }}
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "../composables/useI18n";

export interface SelectOption {
  value: string | number;
  label: string;
  displayHtml?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    triggerClass?: string;
  }>(),
  {
    placeholder: "",
    searchPlaceholder: "",
    triggerClass: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const { t } = useI18n();

const open = ref(false);
const search = ref("");
const highlightIndex = ref(-1);
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const displayLabel = computed(() => {
  if (props.modelValue === "" || props.modelValue === null || props.modelValue === undefined) {
    return props.placeholder || "—";
  }
  const opt = props.options.find((o) => String(o.value) === String(props.modelValue));
  return opt?.label || String(props.modelValue);
});

const filteredOptions = computed(() => {
  if (!search.value) return props.options;
  const q = search.value.toLowerCase();
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function positionDropdown() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropUp = spaceBelow < 260 && rect.top > spaceBelow;

  dropdownStyle.value = {
    position: "fixed",
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(dropUp
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  };
}

function toggle() {
  if (open.value) {
    close();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  open.value = true;
  search.value = "";
  highlightIndex.value = -1;
  positionDropdown();
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function close() {
  open.value = false;
  search.value = "";
}

function select(value: string | number) {
  emit("update:modelValue", value);
  close();
}

function selectHighlighted() {
  if (highlightIndex.value === -1 && props.placeholder) {
    select("");
    return;
  }
  const opt = filteredOptions.value[highlightIndex.value];
  if (opt) select(opt.value);
}

function moveHighlight(delta: number) {
  const max = filteredOptions.value.length - 1;
  const min = props.placeholder ? -1 : 0;
  highlightIndex.value = Math.max(min, Math.min(max, highlightIndex.value + delta));
}

function handleClickOutside(e: MouseEvent) {
  if (
    containerRef.value &&
    !containerRef.value.contains(e.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target as Node)
  ) {
    close();
  }
}

function handleScroll() {
  if (open.value) {
    positionDropdown();
  }
}

watch(search, () => {
  highlightIndex.value = -1;
});

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", handleScroll);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", handleScroll);
});
</script>
