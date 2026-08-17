import type { Dictionary, MatchDetail, MatchEvent } from "@bancada/core";

const ICONS: Record<MatchEvent["type"], string> = {
  GOAL: "⚽",
  OWN_GOAL: "⚽",
  PENALTY_GOAL: "⚽",
  PENALTY_MISSED: "❌",
  YELLOW: "🟨",
  RED: "🟥",
  SUB: "🔁",
  VAR: "📺",
  KICKOFF: "▶️",
  HALFTIME: "⏸",
  FULLTIME: "⏹",
};

export function EventTimeline({ match, dict }: { match: MatchDetail; dict: Dictionary }) {
  const events = [...match.events].sort((a, b) => b.minute - a.minute);
  if (!events.length) return null;
  return (
    <ol className="relative space-y-0.5">
      {events.map((event, i) => {
        const neutral = event.teamId == null;
        const isHome = event.teamId === match.home.id;
        if (neutral) {
          return (
            <li key={i} className="flex items-center gap-3 py-1.5">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {ICONS[event.type]}{" "}
                {event.type === "KICKOFF"
                  ? dict.match.kickoff
                  : event.type === "HALFTIME"
                    ? dict.match.halftime
                    : dict.match.fulltime}
              </span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </li>
          );
        }
        return (
          <li
            key={i}
            className={`flex items-center gap-2 py-1.5 text-sm ${isHome ? "" : "flex-row-reverse text-right"}`}
          >
            <span className="w-10 shrink-0 text-xs font-bold tabular-nums text-neutral-500">
              {event.minute}'{event.extraMinute ? `+${event.extraMinute}` : ""}
            </span>
            <span aria-hidden>{ICONS[event.type]}</span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{event.player}</span>
              {event.assist && (
                <span className="text-xs text-neutral-500"> · {event.assist}</span>
              )}
              {event.type === "PENALTY_GOAL" && (
                <span className="text-xs text-neutral-500"> (p)</span>
              )}
              {event.type === "OWN_GOAL" && (
                <span className="text-xs text-neutral-500"> (a.g.)</span>
              )}
              {event.type === "SUB" && event.detail && (
                <span className="block text-xs text-neutral-500">{event.detail}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
