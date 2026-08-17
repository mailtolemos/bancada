import { NextRequest, NextResponse } from "next/server";
import { getScorers, isDemo } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  try {
    const scorers = await getScorers(league);
    return NextResponse.json(
      { scorers, demo: isDemo() },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
