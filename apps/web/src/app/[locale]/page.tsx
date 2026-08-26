import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, ListOrdered, Newspaper, Radio } from "lucide-react";
import {
  DEFAULT_LEAGUE,
  LIVE_STATUSES,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from "@bancada/core";
import { getMatches, getNews, getStandingsGroups, isDemo } from "@/lib/data";
import { DayAgenda } from "@/components/DayAgenda";
import { MatchSpotlight } from "@/components/MatchSpotlight";
import { LiveMatches } from "@/components/LiveMatches";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { MyClub } from "@/components/MyClub";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";
import { DemoBanner, SectionHeader, SectionSkeleton } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function HomePage({
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
  const isDefault = leagueId === DEFAULT_LEAGUE;

  const [matches, groups] = await Promise.all([
    getMatches(leagueId).catch(() => []),
    getStandingsGroups(leagueId).catch(() => []),
  ]);
  const previewGroups = groups.slice(0, 1).map((g) => ({ ...g, rows: g.rows.slice(0, 8) }));

  const hasLive = matches.some((m) => LIVE_STATUSES.includes(m.status));

  return (
    <div className="space-y-8">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}

      {/* Jogo em destaque: o próximo/atual jogo do clube principal */}
      <MatchSpotlight locale={locale} dict={dict} />

      <LeagueSwitcher basePath={`/${locale}`} current={leagueId} />

      {/* Barra de dias: que jogos há em cada dia da semana */}
      <DayAgenda locale={locale} dict={dict} />

      {/* O meu clube (favorito guardado no dispositivo/conta) */}
      <MyClub matches={matches} locale={locale} dict={dict} />

      {/* Ao vivo / hoje */}
      <section>
        <SectionHeader
          title={hasLive ? dict.home.liveNow : dict.home.today}
          icon={<Radio size={15} className={hasLive ? "text-red-500" : undefined} />}
          href={`/${locale}/jogos${isDefault ? "" : `?liga=${leagueId}`}`}
          linkLabel={dict.home.seeAll}
        />
        <LiveMatches
          initial={matches}
          locale={locale}
          dict={dict}
          leagueId={leagueId}
          filter={hasLive ? "live" : "today"}
          emptyText={dict.home.noLive}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <section>
            <SectionHeader
              title={dict.home.upcoming}
              icon={<CalendarDays size={15} />}
              href={`/${locale}/jogos${isDefault ? "" : `?liga=${leagueId}`}`}
              linkLabel={dict.home.seeAll}
            />
            <LiveMatches
              initial={matches}
              locale={locale}
              dict={dict}
              leagueId={leagueId}
              filter="upcoming"
              showDay
              limit={6}
            />
          </section>

          {/* Notícias em streaming — a home nunca espera pelos feeds RSS */}
          <section>
            <SectionHeader
              title={dict.home.latestNews}
              icon={<Newspaper size={15} />}
              href={`/${locale}/noticias`}
              linkLabel={dict.home.seeAll}
            />
            <Suspense fallback={<SectionSkeleton rows={4} />}>
              <HomeNews locale={locale} dict={dict} />
            </Suspense>
          </section>
        </div>

        <div className="lg:col-span-2">
          <SectionHeader
            title={dict.home.standingsPreview}
            icon={<ListOrdered size={15} />}
            href={`/${locale}/classificacao${isDefault ? "" : `?liga=${leagueId}`}`}
            linkLabel={dict.home.seeAll}
          />
          <StandingsTable
            groups={previewGroups}
            locale={locale}
            dict={dict}
            compact
            leagueId={leagueId}
          />
        </div>
      </div>
    </div>
  );
}

async function HomeNews({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const news = await getNews({ limit: 6 }).catch(() => []);
  if (!news.length) {
    return <p className="card px-4 py-6 text-center text-sm text-neutral-500">{dict.news.empty}</p>;
  }
  const [first, ...rest] = news;
  return (
    <div className="grid gap-2.5">
      {first && <NewsCard item={first} locale={locale} dict={dict} featured />}
      {rest.map((item) => (
        <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
      ))}
    </div>
  );
}
