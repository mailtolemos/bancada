import { notFound } from "next/navigation";
import { CalendarDays, History, Radio } from "lucide-react";
import { DEFAULT_LEAGUE, getDictionary, isLocale } from "@bancada/core";
import { getMatches, isDemo } from "@/lib/data";
import { LiveMatches } from "@/components/LiveMatches";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
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
  const matches = await getMatches(leagueId).catch(() => []);

  return (
    <div className="space-y-8">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <LeagueSwitcher basePath={`/${locale}/jogos`} current={leagueId} />
      <section>
        <SectionHeader title={dict.home.liveNow} icon={<Radio size={15} className="text-red-500" />} />
        <LiveMatches
          initial={matches}
          locale={locale}
          dict={dict}
          leagueId={leagueId}
          filter="live"
          emptyText={dict.home.noLive}
        />
      </section>
      <section>
        <SectionHeader title={dict.home.upcoming} icon={<CalendarDays size={15} />} />
        <LiveMatches initial={matches} locale={locale} dict={dict} leagueId={leagueId} filter="upcoming" showDay />
      </section>
      <section>
        <SectionHeader title={dict.home.recent} icon={<History size={15} />} />
        <LiveMatches initial={matches} locale={locale} dict={dict} leagueId={leagueId} filter="finished" showDay />
      </section>
    </div>
  );
}
