import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";
import { translations, type TranslationKey } from "../i18n";

export function useI18n() {
  const settingsStore = useSettingsStore();

  const locale = computed(() => settingsStore.settings?.language || "de");

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = translations[locale.value] || translations.de;
    let text = dict[key] || translations.de[key] || key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }

    return text;
  }

  return { t, locale };
}
