import Link from "next/link";
import { notFound } from "next/navigation";
import { CLUBS, NEWS_SOURCES, getDictionary, isLocale } from "@bancada/core";
import { getNews } from "@/lib/data";
import { getCommunity, getRumors } from "@/lib/buzz";
import { Flame, MessagesSquare, Newspaper } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fonte?: string; clube?: string; tipo?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { fonte, clube, tipo } = await searchParams;
  const tab = tipo === "rumores" ? "rumores" : tipo === "comunidade" ? "comunidade" : "noticias";

  const items =
    tab === "rumores"
      ? await getRumors({ club: clube }).catch(() => [])
      : tab === "comunidade"
        ? await getCommunity({ club: clube }).catch(() => [])
        : await getNews({ source: fonte, club: clube }).catch(() => []);

  const base = `/${locale}/noticias`;
  const withTab = (t?: string) => (t ? `${base}?tipo=${t}` : base);
  const mainClubs = CLUBS.slice(0, 6);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <SectionHeader title={dict.news.title} icon={<Newspaper size={15} />} />

      {/* Tabs: Notícias | Mercado & Rumores | Comunidade */}
      <div className="flex flex-wrap gap-1.5">
        <TabChip
          href={base}
          active={tab === "noticias"}
          label={dict.news.tabNews}
          icon={<Newspaper size={13} aria-hidden />}
        />
        <TabChip
          href={withTab("rumores")}
          active={tab === "rumores"}
          label={dict.news.tabRumors}
          icon={<Flame size={13} aria-hidden />}
        />
        <TabChip
          href={withTab("comunidade")}
          active={tab === "comunidade"}
          label={dict.news.tabCommunity}
          icon={<MessagesSquare size={13} aria-hidden />}
        />
      </div>

      {/* Filtros por fonte (só nas notícias editoriais) */}
      {tab === "noticias" && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href={base} active={!fonte && !clube} label={dict.news.allSources} />
          {NEWS_SOURCES.map((s) => (
            <FilterChip
              key={s.id}
              href={`${base}?fonte=${s.id}`}
              active={fonte === s.id}
              label={s.name}
            />
          ))}
        </div>
      )}

      {/* Filtros por clube */}
      <div className="flex flex-wrap gap-1.5">
        {mainClubs.map((c) => (
          <FilterChip
            key={c.slug}
            href={`${base}?${tab !== "noticias" ? `tipo=${tab}&` : ""}clube=${c.slug}`}
            active={clube === c.slug}
            label={c.aliases[0]!
              .split(" ")
              .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
              .join(" ")}
          />
        ))}
      </div>

      {items.length ? (
        <div className="grid gap-2.5">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} locale={locale} dict={dict} />
          ))}
        </div>
      ) : (
        <p className="card px-4 py-8 text-center text-sm text-neutral-500">{dict.news.empty}</p>
      )}
    </div>
  );
}

function TabChip({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`chip transition-colors ${
        active
          ? "bg-pitch-600 text-white"
          : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {label}
    </Link>
  );
}
