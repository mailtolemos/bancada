import type { Config } from "tailwindcss";

/**
 * Sistema de design "estádio à noite":
 * - neutral → cinzas com um toque de verde (relvado à sombra)
 * - pitch   → verde-esmeralda elétrico (a marca em ação)
 * - volt    → realce luminoso (destaques, glow, ao vivo)
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: "#f6f8f6",
          100: "#eef1ee",
          200: "#dde3de",
          300: "#c2ccc4",
          400: "#94a098",
          500: "#6b7770",
          600: "#4d5751",
          700: "#3a423d",
          800: "#252b27",
          900: "#151a17",
          950: "#0b0e0c",
        },
        pitch: {
          50: "#ecfdf3",
          100: "#d2f9e3",
          200: "#a9f0cb",
          300: "#71e3ac",
          400: "#38cf88",
          500: "#14b96d",
          600: "#0a9a58",
          700: "#0a7b49",
          800: "#0c613c",
          900: "#0b5033",
          950: "#04291a",
        },
        volt: {
          300: "#86f7bd",
          400: "#4deda0",
          500: "#22e584",
          600: "#12c96e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px -6px rgb(0 0 0 / 0.06)",
        "card-hover": "0 2px 4px rgb(0 0 0 / 0.05), 0 12px 32px -8px rgb(0 0 0 / 0.12)",
        glow: "0 0 0 1px rgb(34 229 132 / 0.22), 0 8px 32px -8px rgb(34 229 132 / 0.35)",
        "glow-live": "0 0 0 1px rgb(239 68 68 / 0.25), 0 8px 28px -8px rgb(239 68 68 / 0.35)",
      },
      animation: {
        "pulse-live": "pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
