import { NextRequest, NextResponse } from "next/server";
import { getStandings, isDemo } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  try {
    const standings = await getStandings(league);
    return NextResponse.json(
      { standings, demo: isDemo() },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
