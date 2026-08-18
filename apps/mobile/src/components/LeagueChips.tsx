import { Pressable, ScrollView, Text } from "react-native";
import { activeLeagues } from "@bancada/core";
import type { Theme } from "@/lib/theme";

export function LeagueChips({
  current,
  onChange,
  theme,
}: {
  current: string;
  onChange: (id: string) => void;
  theme: Theme;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
    >
      {activeLeagues().map((l) => {
        const active = l.id === current;
        return (
          <Pressable
            key={l.id}
            onPress={() => onChange(l.id)}
            style={{
              backgroundColor: active ? theme.c.text : theme.c.chip,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: active ? theme.c.bg : theme.c.text,
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              {l.countryFlag} {l.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
