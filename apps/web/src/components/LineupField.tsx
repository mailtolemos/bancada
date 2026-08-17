import { clubMetaForTeamName, type Dictionary, type MatchDetail, type TeamLineup } from "@bancada/core";

/**
 * Campo de futebol com o 11 inicial posicionado pela grelha "linha:coluna".
 * Equipa da casa em baixo (ataca para cima), visitante em cima.
 */
export function LineupField({ match, dict }: { match: MatchDetail; dict: Dictionary }) {
  if (!match.lineups || match.lineups.length < 2) return null;
  const home = match.lineups.find((l) => l.teamId === match.home.id) ?? match.lineups[0];
  const away = match.lineups.find((l) => l.teamId === match.away.id) ?? match.lineups[1];
  const homeColor = clubMetaForTeamName(match.home.name).colors.primary;
  const awayColor = clubMetaForTeamName(match.away.name).colors.primary;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span>
          {match.home.shortName}{" "}
          <span className="text-xs font-normal text-neutral-500">{home.formation}</span>
        </span>
        <span>
          <span className="text-xs font-normal text-neutral-500">{away.formation}</span>{" "}
          {match.away.shortName}
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-pitch-700/30"
        style={{
          aspectRatio: "2 / 3",
          background:
            "repeating-linear-gradient(0deg, #2f7d4f 0 9.6%, #2a7248 9.6% 19.2%)",
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
        <div className="absolute left-1/2 top-0 h-[12%] w-[46%] -translate-x-1/2 border border-t-0 border-white/40" />
        <div className="absolute bottom-0 left-1/2 h-[12%] w-[46%] -translate-x-1/2 border border-b-0 border-white/40" />

        {/* Visitante (metade de cima, invertido) */}
        <TeamHalf lineup={away} color={awayColor} side="top" />
        {/* Casa (metade de baixo) */}
        <TeamHalf lineup={home} color={homeColor} side="bottom" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {dict.match.coach}
          </p>
          <p>{home.coach ?? "—"}</p>
          <p className="mt-2 font-semibold text-neutral-900 dark:text-neutral-100">
            {dict.match.bench}
          </p>
          {home.bench.map((p) => (
            <p key={`${p.id}-${p.name}`}>
              <span className="tabular-nums">{p.number}</span> {p.name}
            </p>
          ))}
        </div>
        <div className="text-right">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {dict.match.coach}
          </p>
          <p>{away.coach ?? "—"}</p>
          <p className="mt-2 font-semibold text-neutral-900 dark:text-neutral-100">
            {dict.match.bench}
          </p>
          {away.bench.map((p) => (
            <p key={`${p.id}-${p.name}`}>
              {p.name} <span className="tabular-nums">{p.number}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamHalf({
  lineup,
  color,
  side,
}: {
  lineup: TeamLineup;
  color: string;
  side: "top" | "bottom";
}) {
  const rows = Math.max(
    1,
    ...lineup.startXI.map((p) => parseInt(p.grid?.split(":")[0] ?? "1", 10))
  );
  return (
    <>
      {lineup.startXI.map((player, i) => {
        const [rowStr, colStr] = (player.grid ?? `${1 + (i > 0 ? 1 : 0)}:1`).split(":");
        const row = parseInt(rowStr ?? "1", 10);
        const col = parseInt(colStr ?? "1", 10);
        const rowPlayers = lineup.startXI.filter(
          (p) => parseInt(p.grid?.split(":")[0] ?? "0", 10) === row
        ).length;
        // posição vertical dentro da metade (0 = baliza, 1 = meio-campo)
        const depth = rows > 1 ? (row - 1) / (rows - 1) : 0;
        const yWithin = 6 + depth * 36; // 6%..42% a partir da ponta
        const y = side === "top" ? yWithin : 100 - yWithin;
        const x = ((col - 0.5) / Math.max(rowPlayers, 1)) * 100;
        return (
          <div
            key={`${player.id}-${i}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${side === "top" ? 100 - x : x}%`, top: `${y}%` }}
          >
            <span
              className="relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-1 ring-black/20"
              style={{ background: color, color: contrast(color) }}
            >
              {player.number ?? "?"}
              {player.captain && (
                <span className="absolute -left-1.5 -top-1 rounded-sm bg-yellow-400 px-0.5 text-[7px] font-black text-black">
                  C
                </span>
              )}
              {player.rating != null && (
                <span
                  className={`absolute -right-2 -top-1.5 rounded px-0.5 text-[8px] font-bold text-white ${ratingColor(player.rating)}`}
                >
                  {player.rating.toFixed(1)}
                </span>
              )}
            </span>
            <span className="mt-0.5 max-w-16 truncate text-center text-[9px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {lastName(player.name)}
            </span>
          </div>
        );
      })}
    </>
  );
}

function lastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(-1)[0]! : name;
}

function ratingColor(rating: number): string {
  if (rating >= 8) return "bg-emerald-600";
  if (rating >= 7) return "bg-lime-600";
  if (rating >= 6) return "bg-amber-500";
  return "bg-red-600";
}

function contrast(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
