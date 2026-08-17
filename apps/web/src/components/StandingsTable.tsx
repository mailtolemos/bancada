import Link from "next/link";
import { clubMetaForTeamName, type Dictionary, type Locale, type StandingRow } from "@bancada/core";
import { Crest } from "./Crest";

/**
 * Zonas da tabela (Liga Portugal): 1–2 Champions (+3 qual.), 4 Europa League,
 * 5 Conference (qual.), 16 play-off, 17–18 despromoção.
 */
function zone(pos: number, total: number): string {
  if (pos <= 2) return "border-l-blue-600";
  if (pos === 3) return "border-l-blue-400";
  if (pos === 4) return "border-l-orange-500";
  if (pos === 5) return "border-l-emerald-500";
  if (pos === total - 2) return "border-l-amber-500";
  if (pos > total - 2) return "border-l-red-600";
  return "border-l-transparent";
}

export function StandingsTable({
  standings,
  locale,
  dict,
  compact = false,
  highlightTeamId,
}: {
  standings: StandingRow[];
  locale: Locale;
  dict: Dictionary;
  compact?: boolean;
  highlightTeamId?: number;
}) {
  const total = standings.length;
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
            <th className="w-9 py-2.5 pl-3 font-semibold">{dict.standings.position}</th>
            <th className="py-2.5 font-semibold">{dict.standings.team}</th>
            <th className="w-8 py-2.5 text-center font-semibold">{dict.standings.played}</th>
            {!compact && (
              <>
                <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">{dict.standings.won}</th>
                <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">{dict.standings.draw}</th>
                <th className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">{dict.standings.lost}</th>
                <th className="hidden w-10 py-2.5 text-center font-semibold md:table-cell">{dict.standings.goalsFor}</th>
                <th className="hidden w-10 py-2.5 text-center font-semibold md:table-cell">{dict.standings.goalsAgainst}</th>
              </>
            )}
            <th className="w-10 py-2.5 text-center font-semibold">{dict.standings.goalDifference}</th>
            <th className="w-10 py-2.5 pr-3 text-center font-semibold">{dict.standings.points}</th>
            {!compact && (
              <th className="hidden w-24 py-2.5 pr-3 text-center font-semibold lg:table-cell">
                {dict.standings.form}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const slug = clubMetaForTeamName(row.team.name).slug;
            const highlighted = highlightTeamId === row.team.id;
            return (
              <tr
                key={row.team.id}
                className={`border-b border-neutral-100 last:border-0 dark:border-neutral-800/60 ${
                  highlighted ? "bg-pitch-50 dark:bg-pitch-950/40" : ""
                }`}
              >
                <td className={`border-l-[3px] py-2 pl-3 font-semibold tabular-nums text-neutral-500 ${zone(row.position, total)}`}>
                  {row.position}
                </td>
                <td className="py-2">
                  <Link href={`/${locale}/clube/${slug}`} className="flex items-center gap-2 hover:underline">
                    <Crest team={row.team} size={20} />
                    <span className="truncate font-medium">{row.team.shortName}</span>
                  </Link>
                </td>
                <td className="py-2 text-center tabular-nums">{row.playedGames}</td>
                {!compact && (
                  <>
                    <td className="hidden py-2 text-center tabular-nums sm:table-cell">{row.won}</td>
                    <td className="hidden py-2 text-center tabular-nums sm:table-cell">{row.draw}</td>
                    <td className="hidden py-2 text-center tabular-nums sm:table-cell">{row.lost}</td>
                    <td className="hidden py-2 text-center tabular-nums md:table-cell">{row.goalsFor}</td>
                    <td className="hidden py-2 text-center tabular-nums md:table-cell">{row.goalsAgainst}</td>
                  </>
                )}
                <td className="py-2 text-center tabular-nums">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="py-2 pr-3 text-center font-extrabold tabular-nums">{row.points}</td>
                {!compact && (
                  <td className="hidden py-2 pr-3 lg:table-cell">
                    <FormDots form={row.form} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!compact && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-200 px-3 py-2 text-[11px] text-neutral-500 dark:border-neutral-800">
          <LegendDot className="bg-blue-600" label={dict.standings.championsLeague} />
          <LegendDot className="bg-orange-500" label={dict.standings.europaLeague} />
          <LegendDot className="bg-emerald-500" label={dict.standings.conferenceLeague} />
          <LegendDot className="bg-amber-500" label={dict.standings.relegationPlayoff} />
          <LegendDot className="bg-red-600" label={dict.standings.relegation} />
        </div>
      )}
    </div>
  );
}

function FormDots({ form }: { form: string | null }) {
  if (!form) return <span className="text-neutral-400">—</span>;
  return (
    <span className="flex items-center justify-center gap-1">
      {form.slice(0, 5).split("").map((r, i) => (
        <span
          key={i}
          title={r}
          className={`h-2.5 w-2.5 rounded-full ${
            r === "W" ? "bg-emerald-500" : r === "D" ? "bg-neutral-400" : "bg-red-500"
          }`}
        />
      ))}
    </span>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
