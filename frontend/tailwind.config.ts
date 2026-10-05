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
          paper: "rgb(var(--rw-paper-rgb) / <alpha-value>)",
          surface: "rgb(var(--rw-surface-rgb) / <alpha-value>)",
          neutral: "rgb(var(--rw-neutral-rgb) / <alpha-value>)",
          ink: "rgb(var(--rw-ink-rgb) / <alpha-value>)",
          muted: "rgb(var(--rw-muted-rgb) / <alpha-value>)",
          border: "rgb(var(--rw-border-rgb) / <alpha-value>)",
          accent: "rgb(var(--rw-accent-rgb) / <alpha-value>)",
          "accent-hover": "rgb(var(--rw-accent-hover-rgb) / <alpha-value>)",
          "accent-soft": "rgb(var(--rw-accent-soft-rgb) / <alpha-value>)",
        },
        redwell: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
