"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@bancada/core";

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    const parts = pathname.split("/");
    parts[1] = next;
    router.push(parts.join("/") || `/${next}`);
  }

  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={locale}
        onChange={(e) => switchTo(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-lg border-0 bg-transparent pl-2 pr-6 text-sm font-semibold uppercase text-neutral-600 transition-colors hover:bg-neutral-200/70 focus:outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="text-neutral-900">
            {l.toUpperCase()} — {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
        ▾
      </span>
    </label>
  );
}
