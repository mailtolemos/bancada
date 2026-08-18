import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { clubMetaForTeamName } from "@bancada/core";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { Card, Crest } from "@/components/ui";

export default function ClubsScreen() {
  const theme = useTheme();
  const dict = useDict();
  const router = useRouter();
  const { data, loading, refreshing, refresh } = usePolling(() => api.standings());

  if (loading) {
    return <ActivityIndicator color={theme.pitch} style={{ marginTop: 48 }} />;
  }
  const clubs = [...(data ?? [])].sort((a, b) =>
    a.team.shortName.localeCompare(b.team.shortName, "pt")
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.c.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      data={clubs}
      numColumns={2}
      columnWrapperStyle={{ gap: 10 }}
      keyExtractor={(row) => String(row.team.id)}
      onRefresh={refresh}
      refreshing={refreshing}
      renderItem={({ item: row }) => {
        const meta = clubMetaForTeamName(row.team.name);
        return (
          <Pressable
            style={{ flex: 1, marginBottom: 10 }}
            onPress={() => router.push({ pathname: "/clube/[slug]", params: { slug: meta.slug } })}
          >
            <Card theme={theme} style={{ padding: 16, alignItems: "center", gap: 8, overflow: "hidden" }}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: meta.colors.primary,
                }}
              />
              <Crest team={row.team} size={44} />
              <Text style={{ color: theme.c.text, fontWeight: "800", fontSize: 13, textAlign: "center" }}>
                {row.team.shortName}
              </Text>
              <Text style={{ color: theme.c.subtext, fontSize: 11 }}>
                {dict.clubs.position}: {row.position}º
              </Text>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
