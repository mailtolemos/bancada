import { NextRequest, NextResponse } from "next/server";
import { LIVE_STATUSES } from "@bancada/core";
import { getTeamMatches } from "@/lib/data";
import { triggerGoalWatch } from "@/lib/goalWatch";

export const dynamic = "force-dynamic";

/**
 * Resumo de uma equipa para a secção "Os meus clubes":
 * último jogo (resultado), jogo a decorrer e próximo jogo — agregando a liga
 * do clube e as competições europeias em que possa participar (a ESPN separa
 * as qualificações em feeds próprios; aqui já vem tudo fundido).
 */
export async function GET(req: NextRequest) {
  const teamId = Number(req.nextUrl.searchParams.get("team"));
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  if (!Number.isFinite(teamId)) {
    return NextResponse.json({ error: "team obrigatório" }, { status: 400 });
  }
  // Este endpoint é pollado pela home — aproveita para alimentar o detetor.
  triggerGoalWatch();

  const { window, fixtures } = await getTeamMatches(teamId, league).catch(() => ({
    window: [],
    fixtures: [],
  }));

  const live = window.find((m) => LIVE_STATUSES.includes(m.status)) ?? null;
  const last =
    window
      .filter((m) => m.status === "FINISHED")
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0] ?? null;
  const next =
    [...fixtures, ...window.filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")]
      .filter((m) => new Date(m.utcDate).getTime() > Date.now() - 2 * 3600_000)
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0] ?? null;

  return NextResponse.json(
    { last, next, live },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}
