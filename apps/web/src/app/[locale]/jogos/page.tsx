import { notFound } from "next/navigation";
import { CalendarDays, CalendarPlus, History, Radio } from "lucide-react";
import { DEFAULT_LEAGUE, getDictionary, getLeague, isLocale } from "@bancada/core";
import { getMatches, isDemo } from "@/lib/data";
import { DayAgenda } from "@/components/DayAgenda";
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

      {/* Barra de dias: que jogos há em cada dia da semana */}
      <DayAgenda locale={locale} dict={dict} />

      {/* Exportar calendário: liga atual ou todas */}
      <div className="-mt-4 flex flex-wrap gap-1.5">
        <a
          href={`/api/calendar?league=${leagueId}`}
          className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <CalendarPlus size={13} aria-hidden /> {dict.clubs.addToCalendar} —{" "}
          {getLeague(leagueId)?.name ?? leagueId}
        </a>
        <a
          href="/api/calendar?all=1"
          className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <CalendarPlus size={13} aria-hidden /> {dict.common.allLeagues}
        </a>
      </div>

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
