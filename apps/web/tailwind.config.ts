import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#f0faf4",
          100: "#dbf2e4",
          200: "#bae4cd",
          300: "#8bcfae",
          400: "#57b389",
          500: "#34976d",
          600: "#247957",
          700: "#1d6147",
          800: "#194d3a",
          900: "#154031",
          950: "#0a241b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-live": "pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
