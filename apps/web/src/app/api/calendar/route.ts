import { NextRequest, NextResponse } from "next/server";
import { activeLeagues, getLeague, type Match } from "@bancada/core";
import { getSeasonFixtures } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Exporta jogos em formato iCalendar (.ics) — época completa.
 *
 *   /api/calendar?team=<id>&name=<nome>[&league=<liga>]  → jogos de uma equipa
 *   /api/calendar?league=<liga>                          → todos os jogos da liga
 *   /api/calendar?all=1                                  → todas as ligas ativas
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const teamId = sp.get("team") ? Number(sp.get("team")) : null;
  const teamName = sp.get("name") ?? "";
  const leagueId = sp.get("league") ?? undefined;
  const all = sp.get("all") === "1";

  let matches: Match[] = [];
  let calName = "bancada.";

  if (all) {
    const lists = await Promise.all(activeLeagues().map((l) => getSeasonFixtures(l.id)));
    matches = lists.flat().sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    calName = "bancada. — Todas as ligas";
  } else if (teamId != null && Number.isFinite(teamId)) {
    const fixtures = await getSeasonFixtures(leagueId);
    matches = fixtures.filter((m) => m.home.id === teamId || m.away.id === teamId);
    calName = `bancada. — ${teamName || "Clube"}`;
  } else if (leagueId) {
    const league = getLeague(leagueId);
    matches = await getSeasonFixtures(leagueId);
    calName = `bancada. — ${league?.name ?? leagueId}`;
  } else {
    return NextResponse.json(
      { error: "usa ?team=<id>, ?league=<liga> ou ?all=1" },
      { status: 400 }
    );
  }

  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const now = stamp(new Date().toISOString());

  const events = matches
    .map((m) => {
      const league = getLeague(m.leagueId);
      const start = stamp(m.utcDate);
      const end = stamp(new Date(new Date(m.utcDate).getTime() + 2 * 3600_000).toISOString());
      const summary = `${m.home.shortName} vs ${m.away.shortName}`;
      const description = league ? `${league.name} · bancada.` : "bancada.";
      return [
        "BEGIN:VEVENT",
        `UID:bancada-${m.leagueId}-${m.id}@bancada.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        m.venue ? `LOCATION:${escapeIcs(m.venue)}` : null,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//bancada.//Jogos//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const filename = all
    ? "bancada-todas-as-ligas.ics"
    : teamId != null
      ? `bancada-${teamName ? slugify(teamName) : teamId}.ics`
      : `bancada-${leagueId}.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
    },
  });
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
