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
      },
    },
  },
  plugins: [],
};

export default config;
