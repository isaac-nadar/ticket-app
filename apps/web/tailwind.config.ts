import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 👇 Map Tailwind classes to your CSS Variables
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
      },
      // 👇 Map the structural variables!
      borderWidth: {
        ui: "var(--ui-border-width)",
      },
      borderRadius: {
        ui: "var(--ui-radius)",
      },
      boxShadow: {
        ui: "var(--ui-shadow)",
        "ui-hover": "var(--ui-shadow-hover)",
      },
    },
  },
  plugins: [],
};

export default config;
