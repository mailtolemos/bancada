import Link from "next/link";
import { DEFAULT_LEAGUE, activeLeagues } from "@bancada/core";

/** Seletor de competição — preserva a página atual, muda a liga via ?liga=. */
export function LeagueSwitcher({
  basePath,
  current,
}: {
  basePath: string;
  current: string;
}) {
  const leagues = activeLeagues();
  if (leagues.length < 2) return null;
  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4">
      <div className="flex w-max gap-1.5">
        {leagues.map((league) => {
          const active = league.id === current;
          const href =
            league.id === DEFAULT_LEAGUE ? basePath : `${basePath}?liga=${league.id}`;
          return (
            <Link
              key={league.id}
              href={href}
              className={`chip whitespace-nowrap transition-colors ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              <span aria-hidden>{league.countryFlag}</span> {league.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
