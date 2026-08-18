/** Componentes base partilhados da app móvel. */
import { ReactNode } from "react";
import { Image, Text, View, StyleSheet } from "react-native";
import { clubMetaForTeamName, type TeamRef } from "@bancada/core";
import type { Theme } from "@/lib/theme";

export function Card({ theme, children, style }: { theme: Theme; children: ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.c.card,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.c.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <Text
      style={{
        color: theme.c.text,
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 8,
        marginTop: 18,
      }}
    >
      {children}
    </Text>
  );
}

export function Crest({ team, size = 26 }: { team: TeamRef; size?: number }) {
  if (team.crest) {
    return (
      <Image
        source={{ uri: team.crest }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  const meta = clubMetaForTeamName(team.name);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: meta.colors.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: contrast(meta.colors.primary), fontSize: size * 0.32, fontWeight: "800" }}>
        {team.tla.slice(0, 3)}
      </Text>
    </View>
  );
}

export function contrast(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
