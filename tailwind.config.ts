import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FFFFFF", subtle: "#F7F8FC", hover: "#F0F2F8" },
        ink: { DEFAULT: "#1F2430", 2: "#676E85", 3: "#9BA1B4" },
        border: "#E6E9F2",
        primary: { DEFAULT: "#FF6B4A", hover: "#F25A38", soft: "#FFF0EC" },
        violet: { DEFAULT: "#6C5CE7", soft: "#F0EEFF" },
        teal: { DEFAULT: "#00C4A7", soft: "#E6FAF6" },
        amber: { DEFAULT: "#FFB020", soft: "#FFF8E6" },
        success: { DEFAULT: "#00C875", soft: "#E6F9F0" },
        error: { DEFAULT: "#E2445C", soft: "#FDE8EB" },
        info: { DEFAULT: "#579BFC", soft: "#EBF2FF" },
        tier: {
          bronze: "#B08D57",
          silver: "#8E9BAE",
          gold: "#E6A817",
        },
        lucky: {
          red: "#E53935",
          gold: "#FFD700",
          cream: "#FFF8E1",
          darkred: "#C62828",
        },
      },
      borderRadius: {
        card: "12px",
        control: "10px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(31,36,48,0.08)",
        pop: "0 12px 32px rgba(31,36,48,0.14)",
        glow: "0 0 24px rgba(255,107,74,0.25)",
        "lucky-glow": "0 0 32px rgba(255,215,0,0.4)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Bricolage Grotesque", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["24px", { lineHeight: "1.2" }],
        "2xl": ["32px", { lineHeight: "1.2" }],
        "3xl": ["44px", { lineHeight: "1.1" }],
      },
      spacing: {
        "gutter-mobile": "16px",
        "gutter-desktop": "24px",
      },
      keyframes: {
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "red-fall": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0.6" },
        },
        "coin-burst": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(1.3) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(0) rotate(360deg)", opacity: "0" },
        },
        "box-open": {
          "0%": { transform: "scale(1) rotateY(0deg)" },
          "50%": { transform: "scale(1.1) rotateY(180deg)" },
          "100%": { transform: "scale(1) rotateY(360deg)" },
        },
        "stamp-press": {
          "0%": { transform: "scale(2) rotate(-15deg)", opacity: "0" },
          "60%": { transform: "scale(0.9) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,215,0,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255,215,0,0.6)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(1.2)", opacity: "0" },
        },
      },
      animation: {
        "shimmer": "shimmer 1.5s infinite",
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s ease-out",
        "red-fall": "red-fall 3s linear infinite",
        "coin-burst": "coin-burst 0.6s ease-out forwards",
        "box-open": "box-open 0.8s ease-out",
        "stamp-press": "stamp-press 0.4s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float-up": "float-up 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
