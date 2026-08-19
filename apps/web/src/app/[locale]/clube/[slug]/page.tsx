import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  Flame,
  History,
  ListOrdered,
  MessagesSquare,
  Newspaper,
} from "lucide-react";
import {
  clubMetaForTeamName,
  getClub,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from "@bancada/core";
import { getMatches, getNews, getStandings, isDemo } from "@/lib/data";
import { getCommunity, getRumors } from "@/lib/buzz";
import { Crest } from "@/components/Crest";
import { FavoriteButton } from "@/components/FavoriteButton";
import { NotificationsButton } from "@/components/NotificationsButton";
import { LiveMatches } from "@/components/LiveMatches";
import { NewsCard } from "@/components/NewsCard";
import { StandingsTable } from "@/components/StandingsTable";
import { DemoBanner, SectionHeader, SectionSkeleton } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // Só dados rápidos no caminho crítico; feeds pesados chegam em streaming.
  const [standings, matches] = await Promise.all([
    getStandings().catch(() => []),
    getMatches().catch(() => []),
  ]);

  const row = standings.find((r) => clubMetaForTeamName(r.team.name).slug === slug);
  const meta = getClub(slug) ?? (row ? clubMetaForTeamName(row.team.name) : undefined);
  if (!row || !meta) notFound();

  const team = row.team;

  const links: Array<{ label: string; href: string }> = [];
  if (meta.officialSite) links.push({ label: dict.clubs.officialSite, href: meta.officialSite });
  if (meta.twitter) links.push({ label: "X / Twitter", href: meta.twitter });
  if (meta.instagram) links.push({ label: "Instagram", href: meta.instagram });
  if (meta.youtube) links.push({ label: "YouTube", href: meta.youtube });
  if (meta.reddit) links.push({ label: "Reddit", href: meta.reddit });
  if (meta.forum) links.push({ label: "Fórum", href: meta.forum });

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
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <FavoriteButton
            club={{ slug, teamId: team.id, name: team.shortName }}
            labels={{ follow: dict.clubs.follow, following: dict.clubs.following }}
          />
          <NotificationsButton
            club={slug}
            labels={{
              enable: dict.clubs.notifyEnable,
              enabled: dict.clubs.notifyEnabled,
              iosHint: dict.clubs.notifyIosHint,
              denied: dict.clubs.notifyDenied,
            }}
          />
          <a
            href={`/api/calendar?team=${team.id}&name=${encodeURIComponent(team.shortName)}`}
            className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <CalendarPlus size={13} aria-hidden /> {dict.clubs.addToCalendar}
          </a>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <section>
            <SectionHeader title={dict.clubs.nextMatches} icon={<CalendarDays size={15} />} />
            <LiveMatches initial={matches} locale={locale} dict={dict} filter="live" teamId={team.id} limit={2} />
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
            <SectionHeader title={dict.clubs.lastMatches} icon={<History size={15} />} />
            <LiveMatches
              initial={matches}
              locale={locale}
              dict={dict}
              filter="finished"
              teamId={team.id}
              showDay
              limit={4}
            />
          </section>
          <section>
            <SectionHeader title={dict.home.standingsPreview} icon={<ListOrdered size={15} />} />
            <StandingsTable
              standings={standings}
              locale={locale}
              dict={dict}
              compact
              highlightTeamId={team.id}
            />
          </section>
        </div>

        {/* Conteúdo editorial em streaming — nunca bloqueia o carregamento */}
        <div className="space-y-8">
          <section>
            <SectionHeader title={dict.clubs.rumors} icon={<Flame size={15} />} />
            <Suspense fallback={<SectionSkeleton rows={3} />}>
              <ClubRumors slug={slug} locale={locale} dict={dict} />
            </Suspense>
          </section>
          <section>
            <SectionHeader title={dict.clubs.news} icon={<Newspaper size={15} />} />
            <Suspense fallback={<SectionSkeleton rows={3} />}>
              <ClubNews slug={slug} locale={locale} dict={dict} />
            </Suspense>
          </section>
          <section>
            <SectionHeader title={dict.clubs.community} icon={<MessagesSquare size={15} />} />
            <Suspense fallback={<SectionSkeleton rows={3} />}>
              <ClubCommunity slug={slug} locale={locale} dict={dict} />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}

async function ClubRumors({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const rumors = await getRumors({ club: slug, limit: 6 }).catch(() => []);
  if (!rumors.length) {
    return <p className="card px-4 py-6 text-center text-sm text-neutral-500">{dict.clubs.rumorsEmpty}</p>;
  }
  return (
    <div className="grid gap-2.5">
      {rumors.map((item) => (
        <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
      ))}
    </div>
  );
}

async function ClubNews({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const news = await getNews({ club: slug, limit: 8 }).catch(() => []);
  if (!news.length) {
    return <p className="card px-4 py-6 text-center text-sm text-neutral-500">{dict.clubs.noNews}</p>;
  }
  return (
    <div className="grid gap-2.5">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
      ))}
    </div>
  );
}

async function ClubCommunity({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const community = await getCommunity({ club: slug, limit: 6 }).catch(() => []);
  if (!community.length) {
    return <p className="card px-4 py-6 text-center text-sm text-neutral-500">{dict.clubs.communityEmpty}</p>;
  }
  return (
    <div className="grid gap-2.5">
      {community.map((item) => (
        <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
      ))}
    </div>
  );
}
