import Link from "next/link";
import { DEFAULT_LEAGUE, leaguesByRegion } from "@bancada/core";

/**
 * Seletor de competição, agrupado por região (Portugal · Europa · Ligas
 * europeias · Américas · Mundo). Preserva a página atual e muda via ?liga=.
 */
export function LeagueSwitcher({ basePath, current }: { basePath: string; current: string }) {
  const regions = leaguesByRegion();
  if (regions.length === 0) return null;

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">
      <div className="flex w-max items-center gap-1.5">
        {regions.map((group, gi) => (
          <div key={group.region} className="flex items-center gap-1.5">
            {gi > 0 && <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden />}
            {group.leagues.map((league) => {
              const active = league.id === current;
              const href =
                league.id === DEFAULT_LEAGUE ? basePath : `${basePath}?liga=${league.id}`;
              return (
                <Link
                  key={league.id}
                  href={href}
                  title={league.name}
                  className={`chip whitespace-nowrap transition-colors ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span aria-hidden>{league.countryFlag}</span> {league.shortName}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
