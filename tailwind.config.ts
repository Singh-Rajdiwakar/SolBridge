import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#EAF2FF",
        border: "rgba(120, 170, 255, 0.14)",
        card: "#0E1628",
        cyan: {
          300: "#7DE7F7",
          400: "#22D3EE",
          500: "#0EA5E9",
        },
        blue: {
          500: "#3B82F6",
          600: "#1D4ED8",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 16px 60px rgba(59, 130, 246, 0.16)",
        panel: "0 20px 50px rgba(2, 8, 20, 0.48)",
        neon: "0 0 0 1px rgba(59, 130, 246, 0.16), 0 18px 48px rgba(11, 31, 74, 0.38)",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "0.9rem",
        "2xl": "1rem",
        "3xl": "1.15rem",
      },
      backgroundImage: {
        "blue-grid":
          "radial-gradient(circle at top, rgba(48, 126, 255, 0.18), transparent 38%), radial-gradient(circle at right, rgba(26, 184, 255, 0.12), transparent 22%), linear-gradient(180deg, rgba(5, 10, 22, 0.98), rgba(3, 7, 16, 1))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        pulseGlow: "pulseGlow 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
