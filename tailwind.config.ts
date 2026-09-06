import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        trading: {
          bg: "#0B0E14",
          surface: "#121824",
          card: "#182234",
          border: "#223147",
          buy: "#10B981",
          buyHover: "#059669",
          sell: "#F43F5E",
          sellHover: "#E11D48",
          accent: "#38BDF8",
          amber: "#F59E0B",
          text: "#F1F5F9",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
