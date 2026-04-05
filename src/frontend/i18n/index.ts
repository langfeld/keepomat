import de from "./de";
import en from "./en";

export type TranslationKey = keyof typeof de;
export type Translations = Record<TranslationKey, string>;

export const translations: Record<string, Translations> = { de, en };
