import { NextRequest, NextResponse } from "next/server";
import { getAgendaMatches } from "@/lib/data";
import { triggerGoalWatch } from "@/lib/goalWatch";

export const dynamic = "force-dynamic";

/**
 * Agenda de um dia: todos os jogos de todas as competições ativas nesse dia
 * (hora de Portugal, como no resto do site). Alimenta a barra de dias e a
 * página de jogos.
 *
 *   /api/agenda?date=2026-08-23
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "usa ?date=AAAA-MM-DD" }, { status: 400 });
  }
  // O polling desta página também alimenta o detetor de golos.
  triggerGoalWatch();
  const matches = await getAgendaMatches(date);
  return NextResponse.json(
    { matches },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}
