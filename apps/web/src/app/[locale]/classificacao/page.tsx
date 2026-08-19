import { notFound } from "next/navigation";
import { ListOrdered } from "lucide-react";
import { DEFAULT_LEAGUE, getDictionary, getLeague, isLocale } from "@bancada/core";
import { getStandingsGroups, isDemo } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { CompetitionIcon } from "@/components/icons/CompetitionIcon";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function StandingsPage({
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
  const groups = await getStandingsGroups(leagueId).catch(() => []);

  return (
    <div className="space-y-4">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <LeagueSwitcher basePath={`/${locale}/classificacao`} current={leagueId} />
      <SectionHeader
        title={league?.name ?? ""}
        icon={league ? <CompetitionIcon league={league} size={16} /> : <ListOrdered size={15} />}
      />
      {groups.length ? (
        <StandingsTable
          groups={groups}
          locale={locale}
          dict={dict}
          leagueId={leagueId}
          continental={league?.kind === "continental"}
        />
      ) : (
        <p className="card px-4 py-8 text-center text-sm text-neutral-500">
          {dict.standings.notStarted}
        </p>
      )}
    </div>
  );
}
