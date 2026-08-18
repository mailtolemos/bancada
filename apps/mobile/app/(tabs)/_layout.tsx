import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useDict } from "@/lib/i18n";

function LogoTitle() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: theme.c.text }}>bancada</Text>
      <Text style={{ fontSize: 20, fontWeight: "900", color: theme.pitch }}>.</Text>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const dict = useDict();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.c.bg },
        headerShadowVisible: false,
        headerTitle: () => <LogoTitle />,
        headerTitleAlign: "left",
        tabBarStyle: { backgroundColor: theme.c.card, borderTopColor: theme.c.border },
        tabBarActiveTintColor: theme.pitch,
        tabBarInactiveTintColor: theme.c.subtext,
        sceneStyle: { backgroundColor: theme.c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: dict.nav.home,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jogos"
        options={{
          title: dict.nav.matches,
          tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classificacao"
        options={{
          title: dict.nav.standings,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubes"
        options={{
          title: dict.nav.clubs,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-half" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="noticias"
        options={{
          title: dict.nav.news,
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
