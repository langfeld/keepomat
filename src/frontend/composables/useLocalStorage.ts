import { ref, watch } from "vue";

/**
 * Reaktive Ref, die automatisch mit localStorage synchronisiert wird.
 * Ideal für UI-Präferenzen wie Ansichtsmodus, Toggle-Zustände etc.
 *
 * @param key - localStorage-Schlüssel (wird mit "keepomat:" prefixed)
 * @param defaultValue - Standardwert, falls nichts gespeichert ist
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const storageKey = `keepomat:${key}`;

  function read(): T {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  const data = ref<T>(read()) as ReturnType<typeof ref<T>>;

  watch(data, (val) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(val));
    } catch {}
  }, { deep: true });

  return data;
}
