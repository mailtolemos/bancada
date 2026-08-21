import { NextRequest, NextResponse } from "next/server";
import { getLiveMatches, getMatches, getTeamMatches, isDemo } from "@/lib/data";
import { triggerGoalWatch } from "@/lib/goalWatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  const liveOnly = req.nextUrl.searchParams.get("live") === "1";
  const teamId = req.nextUrl.searchParams.get("team");
  // O próprio tráfego de polling alimenta o detetor de golos (throttle 45s).
  triggerGoalWatch();
  try {
    let matches;
    if (teamId != null && Number.isFinite(Number(teamId))) {
      // Todos os jogos da equipa: liga + provas europeias (janela + época).
      const { window, fixtures } = await getTeamMatches(Number(teamId), league);
      const seen = new Set(window.map((m) => m.id));
      matches = [...window, ...fixtures.filter((m) => !seen.has(m.id))];
    } else {
      matches = liveOnly ? await getLiveMatches(league) : await getMatches(league);
    }
    return NextResponse.json(
      { matches, demo: isDemo() },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
