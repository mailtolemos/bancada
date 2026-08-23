import { NextRequest, NextResponse } from "next/server";
import { activeLeagues, type Match } from "@bancada/core";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Agenda de um dia: todos os jogos de todas as competições ativas nesse dia
 * (hora de Portugal, como no resto do site). Alimenta a barra de dias.
 *
 *   /api/agenda?date=2026-08-23
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "usa ?date=AAAA-MM-DD" }, { status: 400 });
  }

  const lists = await Promise.all(
    activeLeagues().map((l) => getMatches(l.id).catch(() => [] as Match[]))
  );
  const seen = new Set<number>();
  const matches = lists
    .flat()
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return dayFmt.format(new Date(m.utcDate)) === date;
    })
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  return NextResponse.json(
    { matches },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
