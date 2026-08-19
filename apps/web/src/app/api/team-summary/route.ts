import { NextRequest, NextResponse } from "next/server";
import { LIVE_STATUSES, type Match } from "@bancada/core";
import { getMatches, getSeasonFixtures } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Resumo de uma equipa para a secção "O meu clube":
 * último jogo (resultado), jogo a decorrer e próximo jogo.
 *
 * O próximo jogo vem do calendário da época completa — a janela de ±10 dias
 * usada nos live scores deixaria de fora jogos marcados mais à frente.
 */
export async function GET(req: NextRequest) {
  const teamId = Number(req.nextUrl.searchParams.get("team"));
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  if (!Number.isFinite(teamId)) {
    return NextResponse.json({ error: "team obrigatório" }, { status: 400 });
  }

  const [window, fixtures] = await Promise.all([
    getMatches(league).catch(() => [] as Match[]),
    getSeasonFixtures(league).catch(() => [] as Match[]),
  ]);

  const mine = (list: Match[]) =>
    list.filter((m) => m.home.id === teamId || m.away.id === teamId);

  const recent = mine(window);
  const upcoming = mine(fixtures);

  const live = recent.find((m) => LIVE_STATUSES.includes(m.status)) ?? null;
  const last =
    recent
      .filter((m) => m.status === "FINISHED")
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0] ?? null;
  const next =
    [...upcoming, ...recent.filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")]
      .filter((m) => new Date(m.utcDate).getTime() > Date.now() - 2 * 3600_000)
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0] ?? null;

  return NextResponse.json(
    { last, next, live },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}
