"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@bancada/core";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  desktopOnly?: boolean;
}

const items = (locale: Locale, dict: Dictionary): NavItem[] => [
  { href: `/${locale}`, label: dict.nav.home, exact: true, icon: "⌂" },
  { href: `/${locale}/jogos`, label: dict.nav.matches, icon: "⚽" },
  { href: `/${locale}/classificacao`, label: dict.nav.standings, icon: "▤" },
  { href: `/${locale}/marcadores`, label: dict.nav.scorers, icon: "🥇", desktopOnly: true },
  { href: `/${locale}/clubes`, label: dict.nav.clubs, icon: "🛡" },
  { href: `/${locale}/noticias`, label: dict.nav.news, icon: "📰" },
];

export function NavLinks({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  return (
    <>
      {items(locale, dict).map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

/** Barra inferior no telemóvel — padrão de app nativa. */
export function MobileNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items(locale, dict)
          .filter((item) => !item.desktopOnly)
          .map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active
                  ? "text-pitch-600 dark:text-pitch-400"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
