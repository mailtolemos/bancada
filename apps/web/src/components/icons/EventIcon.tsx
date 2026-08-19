/** Ícones reais dos eventos de jogo (nada de emojis). */
import { ArrowRightLeft, Ban, Flag, MonitorPlay, Pause, Play, Square } from "lucide-react";
import type { MatchEventType } from "@bancada/core";

/** Cartão amarelo/vermelho desenhado como cartão, não como quadrado colorido. */
function Card({ color }: { color: "yellow" | "red" }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3.5 w-2.5 rounded-[2px] ${
        color === "yellow" ? "bg-amber-400" : "bg-red-600"
      }`}
    />
  );
}

/**
 * Bola de futebol legível a 14–16px: corpo claro com marcações escuras
 * (funciona em tema claro e escuro sem depender da cor do texto).
 */
export function BallIcon({
  size = 15,
  variant = "normal",
}: {
  size?: number;
  variant?: "normal" | "own";
}) {
  const body = variant === "own" ? "#fca5a5" : "#fafafa";
  const mark = variant === "own" ? "#7f1d1d" : "#171717";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="inline-block shrink-0">
      <circle cx="12" cy="12" r="10" fill={body} stroke={mark} strokeWidth="1.5" />
      {/* pentágono central + costuras: dá leitura imediata de "bola" */}
      <path d="M12 6.2l3.9 2.8-1.5 4.6H9.6L8.1 9 12 6.2z" fill={mark} />
      <g stroke={mark} strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 6.2V2.4M15.9 9l3.5-1.2M14.4 13.6l2.3 3M9.6 13.6l-2.3 3M8.1 9L4.6 7.8" />
      </g>
    </svg>
  );
}

export function EventIcon({ type, size = 14 }: { type: MatchEventType; size?: number }) {
  const props = { size, strokeWidth: 2.25, "aria-hidden": true as const, className: "shrink-0" };
  switch (type) {
    case "GOAL":
    case "PENALTY_GOAL":
      return <BallIcon size={size + 2} />;
    case "OWN_GOAL":
      return <BallIcon size={size + 2} variant="own" />;
    case "PENALTY_MISSED":
      return <Ban {...props} className="shrink-0 text-red-500" />;
    case "YELLOW":
      return <Card color="yellow" />;
    case "RED":
      return <Card color="red" />;
    case "SUB":
      return <ArrowRightLeft {...props} className="shrink-0 text-blue-500" />;
    case "VAR":
      return <MonitorPlay {...props} className="shrink-0 text-neutral-400" />;
    case "KICKOFF":
      return <Play {...props} className="shrink-0 text-pitch-600" />;
    case "HALFTIME":
      return <Pause {...props} className="shrink-0 text-neutral-400" />;
    case "FULLTIME":
      return <Square {...props} className="shrink-0 text-neutral-400" />;
    default:
      return <Flag {...props} className="shrink-0 text-neutral-400" />;
  }
}
