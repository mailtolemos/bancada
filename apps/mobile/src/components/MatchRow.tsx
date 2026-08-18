import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LIVE_STATUSES, type Dictionary, type Match } from "@bancada/core";
import type { Theme } from "@/lib/theme";
import { Card, Crest } from "./ui";

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

function dayStr(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Lisbon",
  });
}

export function MatchRow({
  match,
  theme,
  dict,
  showDay,
}: {
  match: Match;
  theme: Theme;
  dict: Dictionary;
  showDay?: boolean;
}) {
  const router = useRouter();
  const live = LIVE_STATUSES.includes(match.status);
  const played = match.score.home != null;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/jogo/[id]", params: { id: String(match.id), liga: match.leagueId } })
      }
    >
      <Card
        theme={theme}
        style={{
          padding: 12,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderColor: live ? theme.live : theme.c.border,
        }}
      >
        <View style={{ width: 52, alignItems: "center" }}>
          {live ? (
            <Text style={{ color: theme.live, fontWeight: "800", fontSize: 12 }}>
              {match.status === "PAUSED"
                ? dict.match.halftime
                : match.minute != null
                  ? `${match.minute}'`
                  : dict.match.live}
            </Text>
          ) : played ? (
            <Text style={{ color: theme.c.subtext, fontSize: 11, fontWeight: "600" }}>
              {dict.match.finished}
            </Text>
          ) : (
            <>
              <Text style={{ color: theme.c.text, fontWeight: "700", fontSize: 13 }}>
                {timeStr(match.utcDate)}
              </Text>
              {showDay && (
                <Text style={{ color: theme.c.subtext, fontSize: 10 }}>{dayStr(match.utcDate)}</Text>
              )}
            </>
          )}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <TeamLine team={match.home} score={match.score.home} theme={theme} />
          <TeamLine team={match.away} score={match.score.away} theme={theme} />
        </View>
      </Card>
    </Pressable>
  );
}

function TeamLine({
  team,
  score,
  theme,
}: {
  team: Match["home"];
  score: number | null;
  theme: Theme;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Crest team={team} size={20} />
      <Text style={{ flex: 1, color: theme.c.text, fontWeight: "600", fontSize: 14 }} numberOfLines={1}>
        {team.shortName}
      </Text>
      {score != null && (
        <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 14 }}>{score}</Text>
      )}
    </View>
  );
}
