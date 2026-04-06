/**
 * Sichere parseInt-Hilfsfunktion mit Standardwert und Bereichsvalidierung.
 */
export function safeParseInt(
  value: string | undefined | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}
