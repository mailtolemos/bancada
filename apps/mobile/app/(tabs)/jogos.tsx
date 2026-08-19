import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text } from "react-native";
import { DEFAULT_LEAGUE, LIVE_STATUSES } from "@bancada/core";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { MatchRow } from "@/components/MatchRow";
import { LeagueChips } from "@/components/LeagueChips";
import { SectionTitle } from "@/components/ui";

export default function MatchesScreen() {
  const theme = useTheme();
  const dict = useDict();
  const [league, setLeague] = useState<string>(DEFAULT_LEAGUE);
  const { data, loading, refreshing, refresh } = usePolling(() => api.matches(league), 30_000);

  const matches = useMemo(() => data ?? [], [data]);
  const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
  const upcoming = matches
    .filter((m) => (m.status === "TIMED" || m.status === "SCHEDULED") && new Date(m.utcDate).getTime() > Date.now() - 2 * 3600_000)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const finished = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate));

  return (
    <ScrollView
      style={{ backgroundColor: theme.c.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.pitch} />}
    >
      <LeagueChips current={league} onChange={setLeague} theme={theme} />
      {loading ? (
        <ActivityIndicator color={theme.pitch} style={{ marginVertical: 32 }} />
      ) : (
        <>
          {live.length > 0 && (
            <>
              <SectionTitle theme={theme}>{dict.home.liveNow}</SectionTitle>
              {live.map((m) => (
                <MatchRow key={m.id} match={m} theme={theme} dict={dict} />
              ))}
            </>
          )}
          <SectionTitle theme={theme}>{dict.home.upcoming}</SectionTitle>
          {upcoming.length ? (
            upcoming.map((m) => <MatchRow key={m.id} match={m} theme={theme} dict={dict} showDay />)
          ) : (
            <Text style={{ color: theme.c.subtext }}>{dict.home.noLive}</Text>
          )}
          <SectionTitle theme={theme}>{dict.home.recent}</SectionTitle>
          {finished.map((m) => (
            <MatchRow key={m.id} match={m} theme={theme} dict={dict} showDay />
          ))}
        </>
      )}
    </ScrollView>
  );
}
