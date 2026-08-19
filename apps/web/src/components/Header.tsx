import Link from "next/link";
import type { Dictionary, Locale } from "@bancada/core";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavLinks, MobileNav } from "./NavLinks";
import { LogoIcon, Wordmark } from "./Logo";
import { AccountButton } from "./AccountButton";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-neutral-100/85 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5" aria-label={dict.appName}>
            <LogoIcon size={32} />
            <Wordmark tagline={dict.tagline} className="text-xl" />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <NavLinks locale={locale} dict={dict} />
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <AccountButton
              labels={{
                signIn: dict.common.signIn,
                signOut: dict.common.signOut,
                account: dict.common.account,
                syncing: dict.common.syncing,
              }}
            />
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
