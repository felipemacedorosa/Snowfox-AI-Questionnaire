import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          start: "#8E2DE2",
          end: "#4A00E0",
          accent: "#7030A0",
        },
        violet: {
          100: "#EDE6FF",
          200: "#D6C6FB",
          300: "#B69AF8",
          400: "#A78BFA",
          500: "#8E2DE2",
          600: "#6D28D9",
          700: "#4A00E0",
          800: "#2A0B6B",
          900: "#150534",
        },
        ink: {
          h: "var(--text-h)",
          b: "var(--text-b)",
          m: "var(--text-m)",
          dim: "var(--text-dim)",
          p: "var(--text-p)",
        },
        surface: {
          0: "var(--bg-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        line: {
          1: "var(--line-1)",
          2: "var(--line-2)",
          3: "var(--line-3)",
          brand: "var(--line-brand)",
        },
        tier: {
          "low-mark": "var(--tier-low-mark)",
          "low-text": "var(--tier-low-text)",
          "emerging-mark": "var(--tier-emerging-mark)",
          "emerging-text": "var(--tier-emerging-text)",
          "moderate-mark": "var(--tier-moderate-mark)",
          "moderate-text": "var(--tier-moderate-text)",
          "high-mark": "var(--tier-high-mark)",
          "high-text": "var(--tier-high-text)",
          "advanced-mark": "var(--tier-advanced-mark)",
          "advanced-text": "var(--tier-advanced-text)",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["'Typo Grotesk'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "12px",
        xl: "20px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        inout: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      maxWidth: {
        landing: "1120px",
        quiz: "680px",
        results: "1040px",
      },
    },
  },
  plugins: [],
};

export default config;
