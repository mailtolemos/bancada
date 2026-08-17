import { NextRequest, NextResponse } from "next/server";
import { getRumors } from "@/lib/buzz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const club = req.nextUrl.searchParams.get("club") ?? undefined;
  try {
    const rumors = await getRumors({ club });
    return NextResponse.json(
      { rumors },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1200" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
