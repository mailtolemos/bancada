import { getLocales } from "expo-localization";
import { getDictionary, isLocale, type Dictionary } from "@bancada/core";

let cached: Dictionary | null = null;

/** Dicionário no idioma do dispositivo (PT/EN/ES/FR, fallback PT). */
export function useDict(): Dictionary {
  if (!cached) {
    const lang = getLocales()[0]?.languageCode ?? "pt";
    cached = getDictionary(isLocale(lang) ? lang : "pt");
  }
  return cached;
}
