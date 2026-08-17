"use client";

import { useState } from "react";
import { clubMetaForTeamName, type TeamRef } from "@bancada/core";

/**
 * Emblema do clube: usa o crest do fornecedor quando carrega; caso contrário
 * (URL em falta, CDN bloqueado, erro), círculo com iniciais nas cores do clube.
 */
export function Crest({ team, size = 28 }: { team: TeamRef; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (team.crest && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.crest}
        alt={team.name}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if ((e.target as HTMLImageElement).naturalWidth === 0) setFailed(true);
        }}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  const meta = clubMetaForTeamName(team.name);
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold uppercase tracking-tight ring-1 ring-black/10 dark:ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.32),
        background: meta.colors.primary,
        color: contrast(meta.colors.primary),
      }}
    >
      {team.tla.slice(0, 3)}
    </span>
  );
}

function contrast(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
