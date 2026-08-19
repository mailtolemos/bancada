import { NextRequest, NextResponse } from "next/server";
import { getLiveMatches, getMatches, isDemo } from "@/lib/data";
import { triggerGoalWatch } from "@/lib/goalWatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  const liveOnly = req.nextUrl.searchParams.get("live") === "1";
  // O próprio tráfego de polling alimenta o detetor de golos (throttle 45s).
  triggerGoalWatch();
  try {
    const matches = liveOnly ? await getLiveMatches(league) : await getMatches(league);
    return NextResponse.json(
      { matches, demo: isDemo() },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
