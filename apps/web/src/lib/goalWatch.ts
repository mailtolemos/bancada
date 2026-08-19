/**
 * Detetor de golos: compara o snapshot atual dos jogos com o anterior (KV)
 * e emite eventos (apito inicial, golo, final) para os subscritores push.
 *
 * É disparado de duas formas complementares:
 *  1. Oportunisticamente pelo tráfego (/api/matches, que a própria UI polla
 *     a cada 30s durante jogos) — com throttle distribuído de 45s.
 *  2. Por um cron externo (/api/cron/goal-watch) como rede de segurança
 *     para quando não há ninguém com o site aberto.
 */
import { clubMetaForTeamName, LIVE_STATUSES, type Match } from "@bancada/core";
import { kvGet, kvLock, kvSet } from "./kv";
import { pushConfigured, sendToClub, type PushPayload } from "./push";
import { getMatches } from "./data";

interface Snapshot {
  [matchId: string]: { h: number | null; a: number | null; status: string };
}

export interface GoalEvent {
  kind: "kickoff" | "goal" | "fulltime";
  match: Match;
  /** para golos: qual equipa marcou ("home" | "away") */
  scorer?: "home" | "away";
}

/** Puro e testável: diferenças entre snapshot anterior e jogos atuais. */
export function detectEvents(prev: Snapshot, matches: Match[]): GoalEvent[] {
  const events: GoalEvent[] = [];
  for (const m of matches) {
    const before = prev[String(m.id)];
    const live = LIVE_STATUSES.includes(m.status);

    if (!before) {
      // Primeira observação: só notifica se acabou de começar.
      if (live && (m.minute ?? 0) <= 5) events.push({ kind: "kickoff", match: m });
      continue;
    }
    if (!LIVE_STATUSES.includes(before.status as Match["status"]) && live) {
      events.push({ kind: "kickoff", match: m });
    }
    if (m.score.home != null && before.h != null && m.score.home > before.h) {
      events.push({ kind: "goal", match: m, scorer: "home" });
    }
    if (m.score.away != null && before.a != null && m.score.away > before.a) {
      events.push({ kind: "goal", match: m, scorer: "away" });
    }
    if (before.status !== "FINISHED" && m.status === "FINISHED" && LIVE_STATUSES.includes(before.status as Match["status"])) {
      events.push({ kind: "fulltime", match: m });
    }
  }
  return events;
}

function toSnapshot(matches: Match[]): Snapshot {
  const snap: Snapshot = {};
  for (const m of matches) {
    snap[String(m.id)] = { h: m.score.home, a: m.score.away, status: m.status };
  }
  return snap;
}

function payloadFor(event: GoalEvent): PushPayload {
  const m = event.match;
  const score = m.score.home != null ? `${m.score.home}–${m.score.away}` : "";
  const url = `/pt/jogo/${m.id}`;
  if (event.kind === "kickoff") {
    return {
      title: `🟢 Começou: ${m.home.shortName} vs ${m.away.shortName}`,
      body: m.venue ?? "Apito inicial",
      url,
      tag: `kickoff-${m.id}`,
    };
  }
  if (event.kind === "fulltime") {
    return {
      title: `⏹ Final: ${m.home.shortName} ${score} ${m.away.shortName}`,
      body: "Resultado final",
      url,
      tag: `ft-${m.id}`,
    };
  }
  const scorer = event.scorer === "home" ? m.home.shortName : m.away.shortName;
  return {
    title: `⚽ GOLO do ${scorer}!`,
    body: `${m.home.shortName} ${score} ${m.away.shortName}${m.minute != null ? ` · ${m.minute}'` : ""}`,
    url,
    tag: `goal-${m.id}-${m.score.home}-${m.score.away}`,
  };
}

const SNAP_KEY = "goalwatch:snapshot:primeira-liga";
const LOCK_KEY = "goalwatch:lock";

/**
 * Executa um ciclo de deteção (Liga Portugal). Devolve o nº de notificações.
 * `force` ignora o throttle (usado pelo cron).
 */
export async function runGoalWatch(force = false): Promise<{ events: number; sent: number }> {
  if (!pushConfigured()) return { events: 0, sent: 0 };
  if (!force && !(await kvLock(LOCK_KEY, 45))) return { events: 0, sent: 0 };

  const matches = await getMatches("primeira-liga").catch(() => []);
  if (!matches.length) return { events: 0, sent: 0 };

  const prevRaw = await kvGet(SNAP_KEY);
  const prev: Snapshot = prevRaw ? (JSON.parse(prevRaw) as Snapshot) : {};
  const events = prevRaw ? detectEvents(prev, matches) : [];

  // Guarda o snapshot novo antes de enviar (evita duplicados em corridas).
  await kvSet(SNAP_KEY, JSON.stringify(toSnapshot(matches)), 24 * 3600);

  let sent = 0;
  for (const event of events) {
    const payload = payloadFor(event);
    const homeSlug = clubMetaForTeamName(event.match.home.name).slug;
    const awaySlug = clubMetaForTeamName(event.match.away.name).slug;
    const results = await Promise.all([
      sendToClub(homeSlug, payload),
      sendToClub(awaySlug, payload),
    ]);
    sent += results.reduce((a, b) => a + b, 0);
  }
  return { events: events.length, sent };
}

/** Dispara em background (não bloqueia a resposta que o acionou). */
export function triggerGoalWatch(): void {
  runGoalWatch().catch(() => {});
}
