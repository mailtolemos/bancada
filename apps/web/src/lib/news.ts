/**
 * Agregador de notícias multi-fonte (RSS).
 * Cada feed é obtido em paralelo com timeout individual — uma fonte em baixo
 * nunca bloqueia as restantes. Resultados normalizados, deduplicados e com
 * deteção automática de clubes para filtragem.
 */
import Parser from "rss-parser";
import { NEWS_SOURCES, detectClubs, isFootballRelevant, type NewsItem } from "@bancada/core";
import { cached } from "./cache";
import { demoNews } from "./demo";

const parser = new Parser({
  timeout: 4500,
  headers: {
    "User-Agent": "bancada./0.1 (agregador de notícias de futebol; +https://bancada.app)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

const NEWS_TTL_MS = 5 * 60 * 1000; // 5 minutos

function isDemo(): boolean {
  return process.env.BANCADA_DEMO === "1";
}

async function fetchFeed(sourceId: string): Promise<NewsItem[]> {
  const source = NEWS_SOURCES.find((s) => s.id === sourceId);
  if (!source) return [];
  try {
    const feed = await parser.parseURL(source.feedUrl);
    return (feed.items ?? [])
      .filter((item) => item.title && item.link)
      .slice(0, 60)
      .map((item) => {
        const title = clean(item.title!);
        const snippet = clean(item.contentSnippet ?? item.summary ?? "").slice(0, 240);
        return {
          id: `${source.id}:${item.guid ?? item.link}`,
          title,
          link: item.link!,
          source: source.name,
          sourceId: source.id,
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          snippet: snippet || null,
          image: extractImage(item),
          clubs: detectClubs(`${title} ${snippet}`),
          kind: "news" as const,
        } satisfies NewsItem;
      })
      // Só futebol: fora audiências de TV, andebol, futsal, ciclismo, etc.
      .filter((item) => isFootballRelevant(`${item.title} ${item.snippet ?? ""}`));
  } catch {
    // Fonte indisponível — falha silenciosa e isolada.
    return [];
  }
}

/** Remove wrappers CDATA, tags HTML e entidades comuns que alguns feeds trazem. */
function clean(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    // tokens internos de alguns feeds, ex: {TEAM_LINK|2240|Flamengo} → Flamengo
    .replace(/\{[A-Z_]+\|[^|}]*\|([^}]*)\}/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && (!enclosure.type || enclosure.type.startsWith("image"))) {
    return enclosure.url;
  }
  const content = (item.content ?? item["content:encoded"]) as string | undefined;
  const match = content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export async function getNews(opts?: {
  club?: string;
  teamName?: string;
  source?: string;
  limit?: number;
}): Promise<NewsItem[]> {
  const all = await cached("news:all", NEWS_TTL_MS, async () => {
    if (isDemo()) return demoNews();
    const results = await Promise.all(NEWS_SOURCES.map((s) => fetchFeed(s.id)));
    const merged = results.flat();
    // Sem nenhuma fonte disponível (ex: sem rede), mostra demo em vez de vazio.
    const items = merged.length > 0 ? merged : demoNews();
    return dedupe(items).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });

  let filtered = all;
  if (opts?.club) {
    const byClub = filtered.filter((n) => n.clubs.includes(opts.club!));
    if (byClub.length || !opts.teamName) {
      filtered = byClub;
    } else {
      // Clube sem metadados (ex: estrangeiro): procura pelo nome no texto.
      const needle = opts.teamName.toLowerCase();
      filtered = filtered.filter((n) =>
        `${n.title} ${n.snippet ?? ""}`.toLowerCase().includes(needle)
      );
    }
  }
  if (opts?.source) filtered = filtered.filter((n) => n.sourceId === opts.source);
  return filtered.slice(0, opts?.limit ?? 60);
}

/** Deduplicação por título normalizado (fontes repetem-se muito entre si). */
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
