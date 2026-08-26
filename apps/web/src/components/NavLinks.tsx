"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  ListOrdered,
  Newspaper,
  Shield,
  Trophy,
} from "lucide-react";
import type { Dictionary, Locale } from "@bancada/core";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Home;
  exact?: boolean;
  desktopOnly?: boolean;
}

const items = (locale: Locale, dict: Dictionary): NavItem[] => [
  { href: `/${locale}`, label: dict.nav.home, exact: true, Icon: Home },
  { href: `/${locale}/jogos`, label: dict.nav.matches, Icon: CalendarDays },
  { href: `/${locale}/classificacao`, label: dict.nav.standings, Icon: ListOrdered },
  { href: `/${locale}/marcadores`, label: dict.nav.scorers, Icon: Trophy, desktopOnly: true },
  { href: `/${locale}/clubes`, label: dict.nav.clubs, Icon: Shield },
  { href: `/${locale}/noticias`, label: dict.nav.news, Icon: Newspaper },
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
            className={`nav-link flex items-center gap-1.5 ${active ? "nav-link-active" : ""}`}
          >
            <item.Icon size={15} strokeWidth={2.25} aria-hidden />
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
    <nav className="fixed inset-x-3 bottom-3 z-40 mb-[env(safe-area-inset-bottom)] rounded-2xl border border-neutral-200/70 bg-white/85 shadow-card-hover backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/85 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items(locale, dict)
          .filter((item) => !item.desktopOnly)
          .map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                  active
                    ? "text-pitch-600 dark:text-volt-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-pitch-600/10 dark:bg-volt-500/15" : ""
                  }`}
                >
                  <item.Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
