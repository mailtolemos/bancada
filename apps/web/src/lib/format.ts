import type { Dictionary } from "@futiq/core";

const localeMap: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  es: "es-ES",
  fr: "fr-FR",
};

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(new Date(iso));
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date(iso));
}

export function relativeDay(iso: string, locale: string, dict: Dictionary): string {
  const tz = "Europe/Lisbon";
  const dayOf = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const target = dayOf(new Date(iso));
  const today = dayOf(new Date());
  const tomorrow = dayOf(new Date(Date.now() + 86400_000));
  const yesterday = dayOf(new Date(Date.now() - 86400_000));
  if (target === today) return dict.common.today;
  if (target === tomorrow) return dict.common.tomorrow;
  if (target === yesterday) return dict.common.yesterday;
  return formatDate(iso, locale);
}

export function timeAgo(iso: string, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(localeMap[locale] ?? "pt-PT", { numeric: "auto" });
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  return rtf.format(Math.round(diffH / 24), "day");
}
