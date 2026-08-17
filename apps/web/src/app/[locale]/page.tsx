import { notFound } from "next/navigation";
import { getDictionary, isLocale, LIVE_STATUSES } from "@bancada/core";
import { getMatches, getNews, getStandings, isDemo } from "@/lib/data";
import { LiveMatches } from "@/components/LiveMatches";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const [matches, standings, news] = await Promise.all([
    getMatches().catch(() => []),
    getStandings().catch(() => []),
    getNews({ limit: 6 }).catch(() => []),
  ]);

  const hasLive = matches.some((m) => LIVE_STATUSES.includes(m.status));

  return (
    <div className="space-y-8">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}

      {/* Ao vivo */}
      <section>
        <SectionHeader
          title={hasLive ? `🔴 ${dict.home.liveNow}` : dict.home.today}
          href={`/${locale}/jogos`}
          linkLabel={dict.home.seeAll}
        />
        <LiveMatches
          initial={matches}
          locale={locale}
          dict={dict}
          filter={hasLive ? "live" : "today"}
          emptyText={dict.home.noLive}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {/* Próximos jogos */}
          <section>
            <SectionHeader
              title={dict.home.upcoming}
              href={`/${locale}/jogos`}
              linkLabel={dict.home.seeAll}
            />
            <LiveMatches
              initial={matches}
              locale={locale}
              dict={dict}
              filter="upcoming"
              showDay
              limit={6}
            />
          </section>

          {/* Últimas notícias */}
          <section>
            <SectionHeader
              title={dict.home.latestNews}
              href={`/${locale}/noticias`}
              linkLabel={dict.home.seeAll}
            />
            <div className="grid gap-2.5">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <SectionHeader
            title={dict.home.standingsPreview}
            href={`/${locale}/classificacao`}
            linkLabel={dict.home.seeAll}
          />
          <StandingsTable standings={standings.slice(0, 8)} locale={locale} dict={dict} compact />
        </div>
      </div>
    </div>
  );
}
