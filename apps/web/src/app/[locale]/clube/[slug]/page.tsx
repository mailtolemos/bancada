import { notFound } from "next/navigation";
import {
  clubMetaForTeamName,
  getClub,
  getDictionary,
  isLocale,
} from "@futiq/core";
import { getMatches, getNews, getStandings, isDemo } from "@/lib/data";
import { Crest } from "@/components/Crest";
import { LiveMatches } from "@/components/LiveMatches";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const [standings, matches, news] = await Promise.all([
    getStandings().catch(() => []),
    getMatches().catch(() => []),
    getNews({ club: slug, limit: 10 }).catch(() => []),
  ]);

  // Resolve a equipa da época atual cujo metadata corresponde ao slug.
  const row = standings.find((r) => clubMetaForTeamName(r.team.name).slug === slug);
  const meta = getClub(slug) ?? (row ? clubMetaForTeamName(row.team.name) : undefined);
  if (!row || !meta) notFound();

  const team = row.team;

  const links: Array<{ label: string; href: string; icon: string }> = [];
  if (meta.officialSite) links.push({ label: dict.clubs.officialSite, href: meta.officialSite, icon: "🌐" });
  if (meta.twitter) links.push({ label: "X / Twitter", href: meta.twitter, icon: "𝕏" });
  if (meta.instagram) links.push({ label: "Instagram", href: meta.instagram, icon: "📷" });
  if (meta.youtube) links.push({ label: "YouTube", href: meta.youtube, icon: "▶" });
  if (meta.reddit) links.push({ label: "Reddit", href: meta.reddit, icon: "👽" });
  if (meta.forum) links.push({ label: "Fórum", href: meta.forum, icon: "💬" });

  return (
    <div className="space-y-8">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}

      {/* Cabeçalho do clube */}
      <div className="card overflow-hidden">
        <div className="h-2" style={{ background: meta.colors.primary }} />
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Crest team={team} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight">{team.name}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {[meta.city, meta.stadium].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums">{row.position}º</p>
            <p className="text-xs text-neutral-500">
              {row.points} {dict.standings.points.toLowerCase()}
            </p>
          </div>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <span aria-hidden>{link.icon}</span> {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <section>
            <SectionHeader title={dict.clubs.nextMatches} />
            <LiveMatches
              initial={matches}
              locale={locale}
              dict={dict}
              filter="live"
              teamId={team.id}
              limit={2}
            />
            <div className="mt-2.5">
              <LiveMatches
                initial={matches}
                locale={locale}
                dict={dict}
                filter="upcoming"
                teamId={team.id}
                showDay
                limit={4}
              />
            </div>
          </section>
          <section>
            <SectionHeader title={dict.clubs.lastMatches} />
            <LiveMatches
              initial={matches}
              locale={locale}
              dict={dict}
              filter="finished"
              teamId={team.id}
              showDay
              limit={4}
              emptyText={dict.home.noLive}
            />
          </section>
          <section>
            <SectionHeader title={dict.home.standingsPreview} />
            <StandingsTable
              standings={standings}
              locale={locale}
              dict={dict}
              compact
              highlightTeamId={team.id}
            />
          </section>
        </div>

        <section>
          <SectionHeader title={dict.clubs.news} />
          {news.length ? (
            <div className="grid gap-2.5">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
              ))}
            </div>
          ) : (
            <p className="card px-4 py-6 text-center text-sm text-neutral-500">
              {dict.clubs.noNews}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
