import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { DEFAULT_LEAGUE, getDictionary, getLeague, isLocale } from "@bancada/core";
import { getScorers, isScorersDemo } from "@/lib/data";
import { Crest } from "@/components/Crest";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function ScorersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ liga?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { liga } = await searchParams;
  const leagueId = liga ?? DEFAULT_LEAGUE;
  const league = getLeague(leagueId);
  const scorers = await getScorers(leagueId).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {isScorersDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <LeagueSwitcher basePath={`/${locale}/marcadores`} current={leagueId} />
      <SectionHeader
        title={`${league?.countryFlag ?? ""} ${dict.scorers.title}`}
        icon={<Trophy size={15} />}
      />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <th className="w-9 py-2.5 pl-3 font-semibold">#</th>
              <th className="py-2.5 font-semibold">{dict.scorers.player}</th>
              <th className="w-14 py-2.5 text-center font-semibold">{dict.scorers.goals}</th>
              <th className="hidden w-14 py-2.5 text-center font-semibold sm:table-cell">
                {dict.scorers.assists}
              </th>
              <th className="hidden w-14 py-2.5 text-center font-semibold sm:table-cell">
                {dict.scorers.penalties}
              </th>
              <th className="hidden w-14 py-2.5 pr-3 text-center font-semibold sm:table-cell">
                {dict.scorers.matches}
              </th>
            </tr>
          </thead>
          <tbody>
            {scorers.map((s, i) => (
              <tr
                key={s.player.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60"
              >
                <td className="py-2.5 pl-3 font-semibold tabular-nums text-neutral-500">{i + 1}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Crest team={s.team} size={22} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.player.name}</p>
                      <p className="truncate text-xs text-neutral-500">{s.team.shortName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-center text-base font-extrabold tabular-nums">
                  {s.goals}
                </td>
                <td className="hidden py-2.5 text-center tabular-nums sm:table-cell">
                  {s.assists ?? "—"}
                </td>
                <td className="hidden py-2.5 text-center tabular-nums sm:table-cell">
                  {s.penalties ?? "—"}
                </td>
                <td className="hidden py-2.5 pr-3 text-center tabular-nums sm:table-cell">
                  {s.playedMatches ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
