"use client";

/** Seletor de idioma compacto: bandeira atual + menu com as restantes. */
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@bancada/core";
import { Flag } from "./icons/Flag";

const FLAG_CODES: Record<Locale, string> = {
  pt: "PT",
  en: "GB",
  es: "ES",
  fr: "FR",
};

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: string) {
    setOpen(false);
    const parts = pathname.split("/");
    parts[1] = next;
    router.push(parts.join("/") || `/${next}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`${label}: ${LOCALE_LABELS[locale]}`}
        aria-label={label}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none transition-colors hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
      >
        <Flag code={FLAG_CODES[locale]} size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchTo(l)}
              className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                l === locale ? "font-bold" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              <Flag code={FLAG_CODES[l]} size={18} />
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
