import { notFound } from "next/navigation";
import { ListOrdered } from "lucide-react";
import { DEFAULT_LEAGUE, getDictionary, getLeague, isLocale } from "@bancada/core";
import { getStandings, isDemo } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
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
  const standings = await getStandings(leagueId).catch(() => []);

  return (
    <div className="space-y-4">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <LeagueSwitcher basePath={`/${locale}/classificacao`} current={leagueId} />
      <SectionHeader
        title={`${league?.countryFlag ?? ""} ${league?.name ?? ""} — ${dict.nav.standings}`}
        icon={<ListOrdered size={15} />}
      />
      <StandingsTable
        standings={standings}
        locale={locale}
        dict={dict}
        linkClubs={leagueId === DEFAULT_LEAGUE}
      />
    </div>
  );
}
