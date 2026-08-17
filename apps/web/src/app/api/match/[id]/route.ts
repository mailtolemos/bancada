import { NextRequest, NextResponse } from "next/server";
import { getMatchDetail, isDemo } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  try {
    const match = await getMatchDetail(Number(id), league);
    if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(
      { match, demo: isDemo() },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
