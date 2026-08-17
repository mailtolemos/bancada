import { pt, type Dictionary } from "./pt";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";

export type Locale = "pt" | "en" | "es" | "fr";

export const LOCALES: Locale[] = ["pt", "en", "es", "fr"];
export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
};

const dictionaries: Record<Locale, Dictionary> = { pt, en, es, fr };

export function getDictionary(locale: string): Dictionary {
  return dictionaries[(locale as Locale) in dictionaries ? (locale as Locale) : DEFAULT_LOCALE];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

export type { Dictionary };
