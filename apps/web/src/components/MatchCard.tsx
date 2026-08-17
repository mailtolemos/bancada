import Link from "next/link";
import { LIVE_STATUSES, type Dictionary, type Locale, type Match } from "@bancada/core";
import { formatTime, relativeDay } from "@/lib/format";
import { Crest } from "./Crest";

export function StatusBadge({ match, dict }: { match: Match; dict: Dictionary }) {
  if (LIVE_STATUSES.includes(match.status)) {
    return (
      <span className="chip bg-red-600/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-600 dark:bg-red-400" />
        {match.status === "PAUSED"
          ? dict.match.halftime
          : match.minute != null
            ? `${match.minute}'`
            : dict.match.live}
      </span>
    );
  }
  const map: Partial<Record<Match["status"], string>> = {
    FINISHED: dict.match.finished,
    AWARDED: dict.match.finished,
    POSTPONED: dict.match.postponed,
    SUSPENDED: dict.match.suspended,
    CANCELLED: dict.match.cancelled,
  };
  const label = map[match.status];
  if (!label) return null;
  return (
    <span className="chip bg-neutral-200/80 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
      {label}
    </span>
  );
}

export function MatchCard({
  match,
  locale,
  dict,
  showDay = false,
}: {
  match: Match;
  locale: Locale;
  dict: Dictionary;
  showDay?: boolean;
}) {
  const live = LIVE_STATUSES.includes(match.status);
  const played = match.score.home != null;
  return (
    <Link
      href={`/${locale}/jogo/${match.id}`}
      className={`card flex items-center gap-3 px-4 py-3 transition-transform hover:-translate-y-0.5 hover:shadow-md ${
        live ? "ring-1 ring-red-500/40" : ""
      }`}
    >
      <div className="flex w-14 flex-col items-center text-center">
        {live || played ? (
          <StatusBadge match={match} dict={dict} />
        ) : (
          <>
            <span className="text-sm font-bold tabular-nums">
              {formatTime(match.utcDate, locale)}
            </span>
            {showDay && (
              <span className="text-[11px] text-neutral-500">
                {relativeDay(match.utcDate, locale, dict)}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <TeamLine team={match.home} score={match.score.home} bold={winner(match) === "home"} />
        <TeamLine team={match.away} score={match.score.away} bold={winner(match) === "away"} />
      </div>
    </Link>
  );
}

function winner(m: Match): "home" | "away" | null {
  if (m.status !== "FINISHED" || m.score.home == null || m.score.away == null) return null;
  if (m.score.home > m.score.away) return "home";
  if (m.score.away > m.score.home) return "away";
  return null;
}

function TeamLine({
  team,
  score,
  bold,
}: {
  team: Match["home"];
  score: number | null;
  bold: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Crest team={team} size={22} />
      <span className={`min-w-0 flex-1 truncate text-sm ${bold ? "font-bold" : "font-medium"}`}>
        {team.shortName}
      </span>
      {score != null && (
        <span className={`text-sm tabular-nums ${bold ? "font-extrabold" : "font-semibold"}`}>
          {score}
        </span>
      )}
    </div>
  );
}
