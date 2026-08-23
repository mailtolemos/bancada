import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import {
  LIVE_STATUSES,
  clubMetaForTeamName,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
  type NewsItem,
  type TeamRef,
} from "@bancada/core";
import { getMatchDetail, isDemo } from "@/lib/data";
import { getNews } from "@/lib/news";
import { MatchDetailView } from "@/components/MatchDetailView";
import { NewsCard } from "@/components/NewsCard";
import { DemoBanner, SectionHeader, SectionSkeleton } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ liga?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { liga } = await searchParams;

  const match = await getMatchDetail(Number(id), liga).catch(() => null);
  if (!match) notFound();

  // Antes do apito inicial não há eventos/onzes — mostra as notícias
  // principais sobre os dois clubes que vão jogar.
  const upcoming =
    !LIVE_STATUSES.includes(match.status) &&
    match.score.home == null &&
    match.events.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <MatchDetailView initial={match} locale={locale} dict={dict} />
      {upcoming && (
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <PreMatchNews home={match.home} away={match.away} locale={locale} dict={dict} />
        </Suspense>
      )}
    </div>
  );
}

/** Notícias sobre as duas equipas do jogo, intercaladas e sem repetições. */
async function PreMatchNews({
  home,
  away,
  locale,
  dict,
}: {
  home: TeamRef;
  away: TeamRef;
  locale: Locale;
  dict: Dictionary;
}) {
  const forTeam = (team: TeamRef) =>
    getNews({
      club: clubMetaForTeamName(team.name).slug,
      teamName: team.shortName,
      limit: 5,
    }).catch(() => [] as NewsItem[]);

  const [homeNews, awayNews] = await Promise.all([forTeam(home), forTeam(away)]);

  // Intercala casa/fora para dar espaço às duas equipas.
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  const max = Math.max(homeNews.length, awayNews.length);
  for (let i = 0; i < max && items.length < 8; i++) {
    for (const list of [homeNews, awayNews]) {
      const item = list[i];
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
  }

  if (!items.length) return null;

  return (
    <section>
      <SectionHeader title={dict.match.teamNews} icon={<Newspaper size={15} />} />
      <div className="grid gap-2.5">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  );
}
