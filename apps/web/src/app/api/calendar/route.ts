import { NextRequest, NextResponse } from "next/server";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Exporta os próximos jogos de uma equipa em formato iCalendar (.ics),
 * pronto a importar no calendário do telemóvel/computador.
 * GET /api/calendar?team=<id>&name=<nome>&league=<liga>
 */
export async function GET(req: NextRequest) {
  const teamId = Number(req.nextUrl.searchParams.get("team"));
  const teamName = req.nextUrl.searchParams.get("name") ?? "Clube";
  const league = req.nextUrl.searchParams.get("league") ?? undefined;
  if (!Number.isFinite(teamId)) {
    return NextResponse.json({ error: "team obrigatório" }, { status: 400 });
  }

  const matches = await getMatches(league).catch(() => []);
  const upcoming = matches
    .filter(
      (m) =>
        (m.home.id === teamId || m.away.id === teamId) &&
        (m.status === "TIMED" || m.status === "SCHEDULED" || m.status === "IN_PLAY")
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const events = upcoming
    .map((m) => {
      const start = stamp(m.utcDate);
      const end = stamp(new Date(new Date(m.utcDate).getTime() + 2 * 3600_000).toISOString());
      const summary = `⚽ ${m.home.shortName} vs ${m.away.shortName}`;
      const location = m.venue ? escapeIcs(m.venue) : "";
      return [
        "BEGIN:VEVENT",
        `UID:bancada-${m.id}@bancada.app`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(summary)}`,
        location ? `LOCATION:${location}` : null,
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
    `X-WR-CALNAME:${escapeIcs(`bancada. — ${teamName}`)}`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bancada-${teamId}.ics"`,
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
