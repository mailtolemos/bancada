import { Linking, Pressable, Text, View } from "react-native";
import type { NewsItem } from "@bancada/core";
import type { Theme } from "@/lib/theme";
import { Card } from "./ui";

function ago(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

export function NewsRow({ item, theme }: { item: NewsItem; theme: Theme }) {
  const accent =
    item.kind === "rumor" ? "#f97316" : item.kind === "social" ? "#8b5cf6" : theme.pitch;
  return (
    <Pressable onPress={() => item.link !== "#" && Linking.openURL(item.link)}>
      <Card theme={theme} style={{ padding: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text style={{ color: accent, fontWeight: "800", fontSize: 11 }}>{item.source}</Text>
          <Text style={{ color: theme.c.subtext, fontSize: 11 }}>{ago(item.publishedAt)}</Text>
        </View>
        <Text style={{ color: theme.c.text, fontWeight: "700", fontSize: 14, lineHeight: 19 }}>
          {item.title}
        </Text>
        {item.snippet ? (
          <Text
            style={{ color: theme.c.subtext, fontSize: 12, lineHeight: 17, marginTop: 3 }}
            numberOfLines={2}
          >
            {item.snippet}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
