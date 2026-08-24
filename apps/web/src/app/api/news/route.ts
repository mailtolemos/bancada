import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/news";
import { triggerNewsWatch } from "@/lib/newsWatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // O tráfego de notícias também alimenta o detetor de notícias.
  triggerNewsWatch();
  const club = req.nextUrl.searchParams.get("club") ?? undefined;
  const source = req.nextUrl.searchParams.get("source") ?? undefined;
  try {
    const news = await getNews({ club, source });
    return NextResponse.json(
      { news },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
