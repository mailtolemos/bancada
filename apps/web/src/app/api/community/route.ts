import { NextRequest, NextResponse } from "next/server";
import { getCommunity } from "@/lib/buzz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const club = req.nextUrl.searchParams.get("club") ?? undefined;
  try {
    const community = await getCommunity({ club });
    return NextResponse.json(
      { community },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1200" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
