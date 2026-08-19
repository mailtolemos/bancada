import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { NewsRow } from "@/components/NewsRow";

type Tab = "news" | "rumors" | "community";

export default function NewsScreen() {
  const theme = useTheme();
  const dict = useDict();
  const [tab, setTab] = useState<Tab>("news");

  const { data, loading, refreshing, refresh } = usePolling(() => {
    if (tab === "rumors") return api.rumors();
    if (tab === "community") return api.community();
    return api.news();
  });

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "news", label: dict.news.tabNews },
    { id: "rumors", label: dict.news.tabRumors },
    { id: "community", label: dict.news.tabCommunity },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.c.bg }}>
      <View style={{ flexDirection: "row", gap: 6, padding: 14, paddingBottom: 8 }}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              backgroundColor: tab === t.id ? theme.c.text : theme.c.chip,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{ color: tab === t.id ? theme.c.bg : theme.c.text, fontWeight: "700", fontSize: 12 }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={theme.pitch} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
          data={data ?? []}
          keyExtractor={(n) => n.id}
          onRefresh={refresh}
          refreshing={refreshing}
          renderItem={({ item }) => <NewsRow item={item} theme={theme} />}
          ListEmptyComponent={
            <Text style={{ color: theme.c.subtext, textAlign: "center", marginTop: 24 }}>
              {dict.news.empty}
            </Text>
          }
        />
      )}
    </View>
  );
}
