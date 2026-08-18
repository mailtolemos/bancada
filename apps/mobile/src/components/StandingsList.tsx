import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { clubMetaForTeamName, type Dictionary, type StandingRow } from "@bancada/core";
import type { Theme } from "@/lib/theme";
import { Card, Crest } from "./ui";

function zoneColor(pos: number, total: number): string | null {
  if (pos <= 2) return "#2563eb";
  if (pos === 3) return "#60a5fa";
  if (pos === 4) return "#f97316";
  if (pos === 5) return "#10b981";
  if (pos === total - 2) return "#f59e0b";
  if (pos > total - 2) return "#dc2626";
  return null;
}

export function StandingsList({
  standings,
  theme,
  dict,
  linkClubs,
  compact,
}: {
  standings: StandingRow[];
  theme: Theme;
  dict: Dictionary;
  linkClubs: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const total = standings.length;
  return (
    <Card theme={theme} style={{ overflow: "hidden" }}>
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.c.border,
        }}
      >
        <Text style={{ width: 26, color: theme.c.subtext, fontSize: 11, fontWeight: "700" }}>#</Text>
        <Text style={{ flex: 1, color: theme.c.subtext, fontSize: 11, fontWeight: "700" }}>
          {dict.standings.team}
        </Text>
        <Text style={{ width: 28, color: theme.c.subtext, fontSize: 11, fontWeight: "700", textAlign: "center" }}>
          {dict.standings.played}
        </Text>
        {!compact && (
          <Text style={{ width: 34, color: theme.c.subtext, fontSize: 11, fontWeight: "700", textAlign: "center" }}>
            {dict.standings.goalDifference}
          </Text>
        )}
        <Text style={{ width: 34, color: theme.c.subtext, fontSize: 11, fontWeight: "700", textAlign: "center" }}>
          {dict.standings.points}
        </Text>
      </View>
      {standings.map((row) => {
        const zone = zoneColor(row.position, total);
        const slug = clubMetaForTeamName(row.team.name).slug;
        const content = (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderLeftWidth: 3,
              borderLeftColor: zone ?? "transparent",
              borderBottomWidth: 1,
              borderBottomColor: theme.c.border,
            }}
          >
            <Text style={{ width: 23, color: theme.c.subtext, fontWeight: "700", fontSize: 13 }}>
              {row.position}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Crest team={row.team} size={20} />
              <Text style={{ color: theme.c.text, fontWeight: "600", fontSize: 13 }} numberOfLines={1}>
                {row.team.shortName}
              </Text>
            </View>
            <Text style={{ width: 28, color: theme.c.text, fontSize: 13, textAlign: "center" }}>
              {row.playedGames}
            </Text>
            {!compact && (
              <Text style={{ width: 34, color: theme.c.text, fontSize: 13, textAlign: "center" }}>
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </Text>
            )}
            <Text style={{ width: 34, color: theme.c.text, fontWeight: "800", fontSize: 13, textAlign: "center" }}>
              {row.points}
            </Text>
          </View>
        );
        return linkClubs ? (
          <Pressable
            key={row.team.id}
            onPress={() => router.push({ pathname: "/clube/[slug]", params: { slug } })}
          >
            {content}
          </Pressable>
        ) : (
          <View key={row.team.id}>{content}</View>
        );
      })}
    </Card>
  );
}
