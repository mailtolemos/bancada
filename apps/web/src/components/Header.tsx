import Link from "next/link";
import type { Dictionary, Locale } from "@bancada/core";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavLinks, MobileNav } from "./NavLinks";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-neutral-100/85 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2" aria-label={dict.appName}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-700 pb-0.5 text-base font-black lowercase leading-none text-white shadow-sm">
              b<span className="text-pitch-200">.</span>
            </span>
            {/* Wordmark: bancada. — minúsculas, ponto em destaque */}
            <span className="flex items-baseline text-xl font-black lowercase tracking-tight">
              <span>bancada</span>
              <span className="text-pitch-600 dark:text-pitch-400">.</span>
              <span className="ml-2.5 hidden max-w-56 truncate text-xs font-medium normal-case tracking-normal text-neutral-400 sm:inline">
                {dict.tagline}
              </span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <NavLinks locale={locale} dict={dict} />
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LocaleSwitcher locale={locale} label={dict.common.language} />
            <ThemeToggle
              labels={{
                light: dict.common.light,
                dark: dict.common.dark,
                system: dict.common.system,
              }}
            />
          </div>
        </div>
      </header>
      <MobileNav locale={locale} dict={dict} />
    </>
  );
}
