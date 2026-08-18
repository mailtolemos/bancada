import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { LIVE_STATUSES, type MatchDetail, type MatchEvent } from "@bancada/core";
import { api } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { Card, Crest, SectionTitle } from "@/components/ui";
import type { Dictionary } from "@bancada/core";

const EVENT_ICON: Record<MatchEvent["type"], string> = {
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

export default function MatchScreen() {
  const { id, liga } = useLocalSearchParams<{ id: string; liga?: string }>();
  const theme = useTheme();
  const dict = useDict();
  const { data: match, loading, refreshing, refresh } = usePolling(
    () => api.match(Number(id), liga),
    30_000
  );

  if (loading || !match) {
    return <ActivityIndicator color={theme.pitch} style={{ marginTop: 48 }} />;
  }

  const live = LIVE_STATUSES.includes(match.status);
  const played = match.score.home != null;

  return (
    <ScrollView
      style={{ backgroundColor: theme.c.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.pitch} />}
    >
      {/* Placar */}
      <Card theme={theme} style={{ padding: 18, alignItems: "center" }}>
        <Text style={{ color: theme.c.subtext, fontSize: 11, marginBottom: 12 }}>
          {new Date(match.utcDate).toLocaleString("pt-PT", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Lisbon",
          })}
          {match.venue ? ` · ${match.venue}` : ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <TeamCol team={match.home} theme={theme} />
          <View style={{ alignItems: "center", width: 96 }}>
            <Text
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: live ? theme.live : theme.c.text,
              }}
            >
              {played ? `${match.score.home}–${match.score.away}` : "vs"}
            </Text>
            {live && (
              <Text style={{ color: theme.live, fontWeight: "800", fontSize: 12 }}>
                {match.status === "PAUSED"
                  ? dict.match.halftime
                  : `${match.minute != null ? `${match.minute}'` : dict.match.live}`}
              </Text>
            )}
            {played && match.halfTimeScore.home != null && (
              <Text style={{ color: theme.c.subtext, fontSize: 11 }}>
                {dict.match.halftime}: {match.halfTimeScore.home}–{match.halfTimeScore.away}
              </Text>
            )}
          </View>
          <TeamCol team={match.away} theme={theme} />
        </View>
        {match.referee && (
          <Text style={{ color: theme.c.subtext, fontSize: 11, marginTop: 10 }}>
            {dict.match.referee}: {match.referee}
          </Text>
        )}
      </Card>

      {/* Eventos */}
      {match.events.length > 0 && (
        <>
          <SectionTitle theme={theme}>{dict.match.events}</SectionTitle>
          <Card theme={theme} style={{ padding: 12 }}>
            {[...match.events]
              .sort((a, b) => b.minute - a.minute)
              .map((e, i) => (
                <EventLine key={i} event={e} match={match} theme={theme} dict={dict} />
              ))}
          </Card>
        </>
      )}

      {/* Estatísticas */}
      {match.stats && match.stats.length >= 2 && (
        <>
          <SectionTitle theme={theme}>{dict.match.stats}</SectionTitle>
          <Card theme={theme} style={{ padding: 14, gap: 10 }}>
            <StatBars match={match} theme={theme} dict={dict} />
          </Card>
        </>
      )}

      {/* Onze inicial */}
      {match.lineups && match.lineups.length >= 2 && (
        <>
          <SectionTitle theme={theme}>{dict.match.lineups}</SectionTitle>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {match.lineups.map((lineup) => {
              const team = lineup.teamId === match.home.id ? match.home : match.away;
              return (
                <Card key={lineup.teamId} theme={theme} style={{ flex: 1, padding: 12 }}>
                  <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 13 }}>
                    {team.shortName}{" "}
                    <Text style={{ color: theme.c.subtext, fontWeight: "500", fontSize: 11 }}>
                      {lineup.formation ?? ""}
                    </Text>
                  </Text>
                  {lineup.startXI.map((p) => (
                    <Text
                      key={`${p.id}-${p.name}`}
                      style={{ color: theme.c.text, fontSize: 12, marginTop: 5 }}
                      numberOfLines={1}
                    >
                      <Text style={{ color: theme.c.subtext, fontWeight: "700" }}>
                        {p.number ?? "–"}{" "}
                      </Text>
                      {p.name}
                    </Text>
                  ))}
                </Card>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function TeamCol({ team, theme }: { team: MatchDetail["home"]; theme: Theme }) {
  return (
    <View style={{ alignItems: "center", gap: 8, flex: 1 }}>
      <Crest team={team} size={52} />
      <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 13, textAlign: "center" }}>
        {team.shortName}
      </Text>
    </View>
  );
}

function EventLine({
  event,
  match,
  theme,
  dict,
}: {
  event: MatchEvent;
  match: MatchDetail;
  theme: Theme;
  dict: Dictionary;
}) {
  if (event.teamId == null) {
    const label =
      event.type === "KICKOFF"
        ? dict.match.kickoff
        : event.type === "HALFTIME"
          ? dict.match.halftime
          : dict.match.fulltime;
    return (
      <Text
        style={{
          color: theme.c.subtext,
          fontSize: 11,
          fontWeight: "700",
          textAlign: "center",
          marginVertical: 6,
        }}
      >
        — {label} —
      </Text>
    );
  }
  const isHome = event.teamId === match.home.id;
  return (
    <View
      style={{
        flexDirection: isHome ? "row" : "row-reverse",
        alignItems: "center",
        gap: 8,
        marginVertical: 4,
      }}
    >
      <Text style={{ color: theme.c.subtext, fontWeight: "700", fontSize: 12, width: 40, textAlign: isHome ? "left" : "right" }}>
        {event.minute}'{event.extraMinute ? `+${event.extraMinute}` : ""}
      </Text>
      <Text style={{ fontSize: 13 }}>{EVENT_ICON[event.type]}</Text>
      <Text style={{ color: theme.c.text, fontSize: 13, fontWeight: "600", flex: 1, textAlign: isHome ? "left" : "right" }} numberOfLines={1}>
        {event.player}
        {event.assist ? <Text style={{ color: theme.c.subtext }}> · {event.assist}</Text> : null}
      </Text>
    </View>
  );
}

function StatBars({ match, theme, dict }: { match: MatchDetail; theme: Theme; dict: Dictionary }) {
  const home = match.stats!.find((s) => s.teamId === match.home.id) ?? match.stats![0];
  const away = match.stats!.find((s) => s.teamId === match.away.id) ?? match.stats![1];
  const rows: Array<{ label: string; h: number | null; a: number | null; pct?: boolean }> = [
    { label: dict.match.possession, h: home.possession, a: away.possession, pct: true },
    { label: dict.match.shots, h: home.shots, a: away.shots },
    { label: dict.match.shotsOnTarget, h: home.shotsOnTarget, a: away.shotsOnTarget },
    { label: dict.match.corners, h: home.corners, a: away.corners },
    { label: dict.match.fouls, h: home.fouls, a: away.fouls },
  ];
  return (
    <>
      {rows
        .filter((r) => r.h != null || r.a != null)
        .map((r) => {
          const h = r.h ?? 0;
          const a = r.a ?? 0;
          const total = h + a || 1;
          return (
            <View key={r.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 12 }}>
                  {h}
                  {r.pct ? "%" : ""}
                </Text>
                <Text style={{ color: theme.c.subtext, fontSize: 10, fontWeight: "700" }}>
                  {r.label.toUpperCase()}
                </Text>
                <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 12 }}>
                  {a}
                  {r.pct ? "%" : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
                <View style={{ flex: h / total, backgroundColor: theme.pitch }} />
                <View style={{ flex: a / total, backgroundColor: theme.c.chip }} />
              </View>
            </View>
          );
        })}
    </>
  );
}
