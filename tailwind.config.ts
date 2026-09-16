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
        canvas: "#08090a",
        surface: {
          DEFAULT: "#0f1115",
          glass: "rgba(18, 21, 28, 0.65)",
          elevated: "#151820",
          subtle: "#12141a",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.16)",
          active: "rgba(99, 102, 241, 0.4)",
        },
        text: {
          primary: "#f3f4f6",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
        accent: {
          indigo: "#6366f1",
          ember: "#f43f5e",
          amber: "#f59e0b",
          emerald: "#10b981",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        bento: "20px",
        card: "16px",
        pill: "9999px",
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glare: "0 0 40px -10px rgba(99, 102, 241, 0.25)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
