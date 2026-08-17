/**
 * Rumores de mercado e conversas da comunidade.
 *
 * - Rumores: Google News RSS com queries de mercado por clube (apanha A Bola,
 *   Record, sites de adeptos e a cobertura das bombas do Fabrizio Romano em
 *   segundos) + query global "Fabrizio Romano" para a Liga Portugal.
 * - Comunidade: posts recentes dos subreddits de cada clube e r/PrimeiraLiga
 *   (via RSS público do Reddit — sem chave).
 *
 * Tudo com falha isolada por fonte e cache generosa.
 */
import Parser from "rss-parser";
import {
  CLUBS,
  detectClubs,
  getClub,
  isBlockedTopic,
  isFootballRelevant,
  type NewsItem,
} from "@bancada/core";
import { cached } from "./cache";

// Google News aceita UA estilo curl; o Reddit exige um UA identificado.
const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "curl/8.5.0",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
});

const redditParser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "bancada:web:v0.1 (by /u/bancada-app)",
    Accept: "application/atom+xml, application/xml, */*",
  },
});

const RUMORS_TTL = 10 * 60 * 1000; // 10 min
const COMMUNITY_TTL = 10 * 60 * 1000;

/* ── Rumores (Google News RSS) ────────────────────────────────── */

function googleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-PT&gl=PT&ceid=PT:pt-150`;
}

/** Limpa o sufixo " - Fonte" que o Google News acrescenta ao título. */
function splitGoogleTitle(raw: string): { title: string; source: string | null } {
  const idx = raw.lastIndexOf(" - ");
  if (idx > 10) {
    return { title: raw.slice(0, idx).trim(), source: raw.slice(idx + 3).trim() || null };
  }
  return { title: raw.trim(), source: null };
}

async function fetchGoogleNews(query: string, idPrefix: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(googleNewsUrl(query));
    return (feed.items ?? [])
      .filter((i) => i.title && i.link)
      .slice(0, 30)
      .map((i) => {
        const { title, source } = splitGoogleTitle(i.title!);
        return {
          id: `${idPrefix}:${i.guid ?? i.link}`,
          title,
          link: i.link!,
          source: source ?? "Google News",
          sourceId: "google-news",
          publishedAt: i.isoDate ?? i.pubDate ?? new Date().toISOString(),
          snippet: null,
          image: null,
          clubs: detectClubs(title),
          kind: "rumor" as const,
        };
      })
      // Só futebol (fora "Casa Benfica", modalidades, TV, …)
      .filter((n) => isFootballRelevant(n.title));
  } catch {
    return [];
  }
}

function rumorQueryForClub(slug: string): string | null {
  const club = getClub(slug);
  if (!club) return null;
  const name = club.aliases[0]!;
  return `"${name}" (mercado OR transferência OR rumor OR reforço OR oficial)`;
}

export async function getRumors(opts?: { club?: string; limit?: number }): Promise<NewsItem[]> {
  const key = `rumors:${opts?.club ?? "all"}`;
  const items = await cached(key, RUMORS_TTL, async () => {
    if (opts?.club) {
      const query = rumorQueryForClub(opts.club);
      if (!query) return [];
      const list = await fetchGoogleNews(query, `rumor:${opts.club}`);
      // Garante que o clube da página aparece na etiquetagem.
      return list.map((n) => ({
        ...n,
        clubs: n.clubs.includes(opts.club!) ? n.clubs : [...n.clubs, opts.club!],
      }));
    }
    // Global: mercado da Liga Portugal + Fabrizio Romano sobre clubes portugueses.
    const [liga, romano] = await Promise.all([
      fetchGoogleNews(`"Liga Portugal" OR "Liga Betclic" (mercado OR transferências)`, "rumor:liga"),
      fetchGoogleNews(
        `"Fabrizio Romano" (Benfica OR Porto OR Sporting OR Braga OR "Liga Portugal")`,
        "rumor:romano"
      ),
    ]);
    return [...romano, ...liga];
  });

  const deduped = dedupeByTitle(items).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return deduped.slice(0, opts?.limit ?? 40);
}

/* ── Comunidade (Reddit RSS) ──────────────────────────────────── */

const LEAGUE_SUB = "PrimeiraLiga";

async function fetchReddit(sub: string): Promise<NewsItem[]> {
  try {
    const feed = await redditParser.parseURL(`https://www.reddit.com/r/${sub}/hot.rss?limit=20`);
    return (feed.items ?? [])
      .filter((i) => i.title && i.link)
      .slice(0, 20)
      .map((i) => ({
        id: `reddit:${sub}:${i.id ?? i.link}`,
        title: i.title!.trim(),
        link: i.link!,
        source: `r/${sub}`,
        sourceId: `reddit-${sub}`,
        publishedAt: i.isoDate ?? i.pubDate ?? new Date().toISOString(),
        snippet: (i.author as string | undefined) ? `u/${String(i.author).replace(/^\/u\//, "")}` : null,
        image: null,
        clubs: detectClubs(i.title!),
        kind: "social" as const,
      }))
      // Nos posts de comunidade só cortamos temas claramente fora (modalidades, TV).
      .filter((n) => !isBlockedTopic(n.title));
  } catch {
    return [];
  }
}

export async function getCommunity(opts?: { club?: string; limit?: number }): Promise<NewsItem[]> {
  const key = `community:${opts?.club ?? "all"}`;
  const items = await cached(key, COMMUNITY_TTL, async () => {
    if (opts?.club) {
      const sub = getClub(opts.club)?.redditSub;
      const feeds = await Promise.all([
        sub ? fetchReddit(sub) : Promise.resolve([]),
        // No sub da liga, filtra posts que mencionem o clube.
        fetchReddit(LEAGUE_SUB).then((list) =>
          list.filter((n) => n.clubs.includes(opts.club!))
        ),
      ]);
      return feeds.flat();
    }
    const subs = [LEAGUE_SUB, ...CLUBS.map((c) => c.redditSub).filter((s): s is string => Boolean(s))];
    const feeds = await Promise.all(subs.map(fetchReddit));
    return feeds.flat();
  });

  const deduped = dedupeByTitle(items).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return deduped.slice(0, opts?.limit ?? 30);
}

/* ── util ─────────────────────────────────────────────────────── */

function dedupeByTitle(items: NewsItem[]): NewsItem[] {
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
