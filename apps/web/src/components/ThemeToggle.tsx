"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({
  labels,
}: {
  labels: { light: string; dark: string; system: string };
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="h-8 w-8 rounded-lg" aria-hidden />;
  }

  const next = theme === "system" ? (resolvedTheme === "dark" ? "light" : "dark") : theme === "dark" ? "light" : "dark";
  const label = resolvedTheme === "dark" ? labels.light : labels.dark;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
    >
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
