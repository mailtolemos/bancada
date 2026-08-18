import { useMemo } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { clubMetaForTeamName, getClub, LIVE_STATUSES } from "@bancada/core";
import { api, API } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { Card, Crest, SectionTitle } from "@/components/ui";
import { MatchRow } from "@/components/MatchRow";
import { NewsRow } from "@/components/NewsRow";

export default function ClubScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const dict = useDict();

  const standingsQ = usePolling(() => api.standings());
  const matchesQ = usePolling(() => api.matches(), 30_000);
  const rumorsQ = usePolling(() => api.rumors(slug));
  const newsQ = usePolling(() => api.news(slug));
  const communityQ = usePolling(() => api.community(slug));

  const row = useMemo(
    () => (standingsQ.data ?? []).find((r) => clubMetaForTeamName(r.team.name).slug === slug),
    [standingsQ.data, slug]
  );
  const meta = getClub(slug!) ?? (row ? clubMetaForTeamName(row.team.name) : undefined);

  if (standingsQ.loading || !row || !meta) {
    return <ActivityIndicator color={theme.pitch} style={{ marginTop: 48 }} />;
  }

  const team = row.team;
  const clubMatches = (matchesQ.data ?? []).filter(
    (m) => m.home.id === team.id || m.away.id === team.id
  );
  const relevant = [
    ...clubMatches.filter((m) => LIVE_STATUSES.includes(m.status)),
    ...clubMatches
      .filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
      .slice(0, 3),
    ...clubMatches
      .filter((m) => m.status === "FINISHED")
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
      .slice(0, 3),
  ];

  const links: Array<{ label: string; url: string }> = [];
  if (meta.officialSite) links.push({ label: dict.clubs.officialSite, url: meta.officialSite });
  if (meta.twitter) links.push({ label: "X", url: meta.twitter });
  if (meta.instagram) links.push({ label: "Instagram", url: meta.instagram });
  if (meta.youtube) links.push({ label: "YouTube", url: meta.youtube });
  if (meta.reddit) links.push({ label: "Reddit", url: meta.reddit });
  if (meta.forum) links.push({ label: "Fórum", url: meta.forum });
  links.push({
    label: dict.clubs.addToCalendar,
    url: `${API}/api/calendar?team=${team.id}&name=${encodeURIComponent(team.shortName)}`,
  });

  return (
    <ScrollView
      style={{ backgroundColor: theme.c.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={matchesQ.refreshing} onRefresh={matchesQ.refresh} tintColor={theme.pitch} />
      }
    >
      {/* Cabeçalho */}
      <Card theme={theme} style={{ overflow: "hidden" }}>
        <View style={{ height: 6, backgroundColor: meta.colors.primary }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
          <Crest team={team} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.c.text, fontWeight: "900", fontSize: 19 }}>{team.name}</Text>
            <Text style={{ color: theme.c.subtext, fontSize: 12 }}>
              {[meta.city, meta.stadium].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: theme.c.text, fontWeight: "900", fontSize: 22 }}>{row.position}º</Text>
            <Text style={{ color: theme.c.subtext, fontSize: 11 }}>
              {row.points} {dict.standings.points.toLowerCase()}
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 14, paddingBottom: 12 }}
        >
          {links.map((l) => (
            <Pressable
              key={l.url}
              onPress={() => Linking.openURL(l.url)}
              style={{
                backgroundColor: theme.c.chip,
                borderRadius: 999,
                paddingHorizontal: 11,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: theme.c.text, fontSize: 11, fontWeight: "700" }}>{l.label} ↗</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <SectionTitle theme={theme}>{dict.clubs.nextMatches}</SectionTitle>
      {relevant.map((m) => (
        <MatchRow key={m.id} match={m} theme={theme} dict={dict} showDay />
      ))}

      <SectionTitle theme={theme}>🔥 {dict.clubs.rumors}</SectionTitle>
      {(rumorsQ.data ?? []).slice(0, 5).map((n) => (
        <NewsRow key={n.id} item={n} theme={theme} />
      ))}
      {!rumorsQ.loading && !(rumorsQ.data ?? []).length && (
        <Text style={{ color: theme.c.subtext, fontSize: 12 }}>{dict.clubs.rumorsEmpty}</Text>
      )}

      <SectionTitle theme={theme}>{dict.clubs.news}</SectionTitle>
      {(newsQ.data ?? []).slice(0, 6).map((n) => (
        <NewsRow key={n.id} item={n} theme={theme} />
      ))}

      <SectionTitle theme={theme}>💬 {dict.clubs.community}</SectionTitle>
      {(communityQ.data ?? []).slice(0, 5).map((n) => (
        <NewsRow key={n.id} item={n} theme={theme} />
      ))}
      {!communityQ.loading && !(communityQ.data ?? []).length && (
        <Text style={{ color: theme.c.subtext, fontSize: 12 }}>{dict.clubs.communityEmpty}</Text>
      )}
    </ScrollView>
  );
}
