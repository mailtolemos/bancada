import { useColorScheme } from "react-native";

export const palette = {
  pitch: "#249157",
  pitchLight: "#57b389",
  live: "#dc2626",
  light: {
    bg: "#f5f5f4",
    card: "#ffffff",
    text: "#171717",
    subtext: "#737373",
    border: "#e5e5e5",
    chip: "#e7e5e4",
  },
  dark: {
    bg: "#0a0a0a",
    card: "#171717",
    text: "#fafafa",
    subtext: "#a3a3a3",
    border: "#262626",
    chip: "#262626",
  },
};

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return { dark, c: dark ? palette.dark : palette.light, pitch: palette.pitch, live: palette.live };
}

export type Theme = ReturnType<typeof useTheme>;
