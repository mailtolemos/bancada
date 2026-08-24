/**
 * Detetor de notícias: compara as notícias atuais com as já enviadas (KV)
 * e envia push aos subscritores de notícias de cada clube.
 *
 * Ritmo mais calmo do que o dos golos (notícias não são ao segundo):
 * throttle distribuído de 4 minutos, disparado pelo tráfego de /api/news
 * e pelo cron externo.
 */
import type { NewsItem } from "@bancada/core";
import { kvGet, kvLock, kvSet } from "./kv";
import { newsClubs, pushConfigured, sendToClub, teamNameFor, type PushPayload } from "./push";
import { getNews } from "./news";

const SENT_KEY = "newswatch:sent:v1";
const LOCK_KEY = "newswatch:lock";
const MAX_SENT_IDS = 500;
/** Só notifica notícias publicadas nas últimas 12 horas. */
const FRESH_MS = 12 * 3600 * 1000;
/** Máximo de notícias enviadas por clube em cada ciclo (evita rajadas). */
const PER_CLUB_LIMIT = 3;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Nome corresponde como palavra inteira (evita "Real" em "realidade"). */
function nameMatches(text: string, name: string | null): boolean {
  if (!name) return false;
  const n = normalize(name).trim();
  if (n.length < 3) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(text);
}

/** Puro e testável: que notícias enviar a cada clube subscrito. */
export function pickNewsToSend(
  items: NewsItem[],
  sentIds: Set<string>,
  clubs: Array<{ slug: string; name: string | null }>,
  now = Date.now()
): Array<{ slug: string; item: NewsItem }> {
  const out: Array<{ slug: string; item: NewsItem }> = [];
  const perClub = new Map<string, number>();
  for (const item of items) {
    if (sentIds.has(item.id)) continue;
    const age = now - new Date(item.publishedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age > FRESH_MS) continue;
    const text = normalize(`${item.title} ${item.snippet ?? ""}`);
    for (const club of clubs) {
      const matches = item.clubs.includes(club.slug) || nameMatches(text, club.name);
      if (!matches) continue;
      const count = perClub.get(club.slug) ?? 0;
      if (count >= PER_CLUB_LIMIT) continue;
      perClub.set(club.slug, count + 1);
      out.push({ slug: club.slug, item });
    }
  }
  return out;
}

function payloadFor(item: NewsItem): PushPayload {
  return {
    title: item.title,
    body: item.source,
    // O clique abre o artigo original.
    url: item.link,
    tag: `news-${item.id}`,
  };
}

/** Um ciclo de deteção de notícias. `force` ignora o throttle (cron). */
export async function runNewsWatch(force = false): Promise<{ events: number; sent: number }> {
  if (!pushConfigured()) return { events: 0, sent: 0 };
  if (!force && !(await kvLock(LOCK_KEY, 240))) return { events: 0, sent: 0 };

  const slugs = await newsClubs();
  if (!slugs.length) return { events: 0, sent: 0 };

  const [items, names] = await Promise.all([
    getNews({ limit: 80 }).catch(() => [] as NewsItem[]),
    Promise.all(slugs.map((s) => teamNameFor(s).catch(() => null))),
  ]);
  if (!items.length) return { events: 0, sent: 0 };

  const sentRaw = await kvGet(SENT_KEY);
  const firstRun = sentRaw == null;
  const sentList: string[] = sentRaw ? (JSON.parse(sentRaw) as string[]) : [];
  const sentIds = new Set(sentList);

  const clubs = slugs.map((slug, i) => ({ slug, name: names[i] ?? null }));
  const toSend = firstRun ? [] : pickNewsToSend(items, sentIds, clubs);

  // Marca como vistas todas as atuais (na primeira execução não envia nada,
  // só aprende o estado — igual ao detetor de golos).
  const nextSent = [...new Set([...toSend.map((t) => t.item.id), ...items.map((i) => i.id), ...sentList])]
    .slice(0, MAX_SENT_IDS);
  await kvSet(SENT_KEY, JSON.stringify(nextSent), 7 * 24 * 3600);

  let sent = 0;
  for (const { slug, item } of toSend) {
    sent += await sendToClub(slug, payloadFor(item), "news");
  }
  return { events: toSend.length, sent };
}

/** Dispara em background (não bloqueia a resposta que o acionou). */
export function triggerNewsWatch(): void {
  runNewsWatch().catch(() => {});
}
