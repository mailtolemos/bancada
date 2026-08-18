import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/lib/theme";

export default function RootLayout() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.c.bg },
          headerTintColor: theme.c.text,
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: theme.c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="jogo/[id]" options={{ title: "" }} />
        <Stack.Screen name="clube/[slug]" options={{ title: "" }} />
      </Stack>
    </>
  );
}
