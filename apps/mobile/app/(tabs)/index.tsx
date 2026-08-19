import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text } from "react-native";
import { DEFAULT_LEAGUE, LIVE_STATUSES } from "@bancada/core";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { MatchRow } from "@/components/MatchRow";
import { StandingsList } from "@/components/StandingsList";
import { NewsRow } from "@/components/NewsRow";
import { LeagueChips } from "@/components/LeagueChips";
import { SectionTitle } from "@/components/ui";

export default function HomeScreen() {
  const theme = useTheme();
  const dict = useDict();
  const [league, setLeague] = useState<string>(DEFAULT_LEAGUE);

  const matchesQ = usePolling(() => api.matches(league), 30_000);
  const standingsQ = usePolling(() => api.standings(league));
  const newsQ = usePolling(() => api.news());

  const matches = useMemo(() => matchesQ.data ?? [], [matchesQ.data]);
  const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
  const upcoming = matches
    .filter((m) => (m.status === "TIMED" || m.status === "SCHEDULED") && new Date(m.utcDate).getTime() > Date.now() - 2 * 3600_000)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 6);

  return (
    <ScrollView
      style={{ backgroundColor: theme.c.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={matchesQ.refreshing} onRefresh={matchesQ.refresh} tintColor={theme.pitch} />
      }
    >
      <LeagueChips current={league} onChange={setLeague} theme={theme} />

      {matchesQ.loading ? (
        <ActivityIndicator color={theme.pitch} style={{ marginVertical: 32 }} />
      ) : (
        <>
          <SectionTitle theme={theme}>
            {live.length ? dict.home.liveNow : dict.home.upcoming}
          </SectionTitle>
          {(live.length ? live : upcoming).map((m) => (
            <MatchRow key={m.id} match={m} theme={theme} dict={dict} showDay />
          ))}
          {!live.length && !upcoming.length && (
            <Text style={{ color: theme.c.subtext }}>{dict.home.noLive}</Text>
          )}

          {live.length > 0 && (
            <>
              <SectionTitle theme={theme}>{dict.home.upcoming}</SectionTitle>
              {upcoming.map((m) => (
                <MatchRow key={m.id} match={m} theme={theme} dict={dict} showDay />
              ))}
            </>
          )}

          <SectionTitle theme={theme}>{dict.home.standingsPreview}</SectionTitle>
          <StandingsList
            standings={(standingsQ.data ?? []).slice(0, 8)}
            theme={theme}
            dict={dict}
            compact
            linkClubs={league === DEFAULT_LEAGUE}
          />

          <SectionTitle theme={theme}>{dict.home.latestNews}</SectionTitle>
          {(newsQ.data ?? []).slice(0, 8).map((n) => (
            <NewsRow key={n.id} item={n} theme={theme} />
          ))}
        </>
      )}
    </ScrollView>
  );
}
