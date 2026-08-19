import { ImageResponse } from "next/og";
import { clubMetaForTeamName } from "@bancada/core";
import { getMatchDetail } from "@/lib/data";
import { SITE_HOST } from "@/lib/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "bancada. — resultado";

/** Cartão de partilha gerado por jogo (WhatsApp, X, iMessage, …). */
export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchDetail(Number(id)).catch(() => null);

  const home = match?.home;
  const away = match?.away;
  const homeColor = home ? clubMetaForTeamName(home.name).colors.primary : "#34976d";
  const awayColor = away ? clubMetaForTeamName(away.name).colors.primary : "#64748B";
  const played = match?.score.home != null;
  const live = match?.status === "IN_PLAY" || match?.status === "PAUSED";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0c1210 0%, #10231b 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 64,
        }}
      >
        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2f9168, #12382b)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              <div style={{ width: 9, height: 14, background: "white", borderRadius: 2 }} />
              <div style={{ width: 9, height: 22, background: "white", borderRadius: 2 }} />
              <div style={{ width: 9, height: 30, background: "white", borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 900 }}>
            bancada<span style={{ color: "#57b389" }}>.</span>
          </div>
          {live && (
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                background: "#dc2626",
                borderRadius: 999,
                padding: "8px 22px",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              ● AO VIVO {match?.minute != null ? `${match.minute}'` : ""}
            </div>
          )}
        </div>

        {/* Placar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <TeamCol name={home?.shortName ?? "—"} tla={home?.tla ?? "?"} color={homeColor} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", fontSize: 120, fontWeight: 900, letterSpacing: -4 }}>
              {played ? `${match!.score.home}–${match!.score.away}` : "vs"}
            </div>
            {match?.venue && (
              <div style={{ display: "flex", fontSize: 24, color: "#9ca3af" }}>{match.venue}</div>
            )}
          </div>
          <TeamCol name={away?.shortName ?? "—"} tla={away?.tla ?? "?"} color={awayColor} />
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#6b7280", justifyContent: "center" }}>
          Todo o futebol. Num só lugar. — {SITE_HOST}
        </div>
      </div>
    ),
    size
  );
}

function TeamCol({ name, tla, color }: { name: string; tla: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        width: 320,
      }}
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 999,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          fontWeight: 900,
          color: contrast(color),
          border: "6px solid rgba(255,255,255,0.15)",
        }}
      >
        {tla.slice(0, 3)}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function contrast(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
