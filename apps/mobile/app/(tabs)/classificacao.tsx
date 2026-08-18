import { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { DEFAULT_LEAGUE } from "@bancada/core";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { StandingsList } from "@/components/StandingsList";
import { LeagueChips } from "@/components/LeagueChips";

export default function StandingsScreen() {
  const theme = useTheme();
  const dict = useDict();
  const [league, setLeague] = useState<string>(DEFAULT_LEAGUE);
  const { data, loading, refreshing, refresh } = usePolling(() => api.standings(league));

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
        <StandingsList
          standings={data ?? []}
          theme={theme}
          dict={dict}
          linkClubs={league === DEFAULT_LEAGUE}
        />
      )}
    </ScrollView>
  );
}
