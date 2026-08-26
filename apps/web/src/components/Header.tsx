import Link from "next/link";
import { UserCog } from "lucide-react";
import type { Dictionary, Locale } from "@bancada/core";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavLinks, MobileNav } from "./NavLinks";
import { LogoIcon, Wordmark } from "./Logo";
import { AccountButton } from "./AccountButton";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-neutral-950/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={`/${locale}`} className="flex min-w-0 shrink items-center gap-2.5" aria-label={dict.appName}>
            <LogoIcon size={32} />
            <Wordmark tagline={dict.tagline} className="text-xl" />
          </Link>
          <nav className="ml-3 hidden shrink-0 items-center gap-0.5 md:flex lg:gap-1">
            <NavLinks locale={locale} dict={dict} />
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <AccountButton
              labels={{
                signIn: dict.common.signIn,
                signOut: dict.common.signOut,
                account: dict.common.account,
                syncing: dict.common.syncing,
                profile: dict.common.profile,
              }}
            />
            <Link
              href={`/${locale}/perfil`}
              title={dict.profile.title}
              aria-label={dict.profile.title}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-200/70 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <UserCog size={17} aria-hidden />
            </Link>
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
