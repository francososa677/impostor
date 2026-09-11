/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#050507",
          900: "#09090b",
          850: "#101014",
          800: "#18181b",
          700: "#27272a",
        },
        crimson: {
          950: "#4c0519",
          900: "#881337",
          800: "#9f1239",
          700: "#be123c",
          600: "#e11d48",
          500: "#f43f5e",
          400: "#fb7185",
        },
        blood: {
          glow: "rgba(225, 29, 72, 0.4)",
          shadow: "rgba(136, 19, 55, 0.6)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "scale-up": "scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        glowPulse: {
          "0%": { boxShadow: "0 0 15px rgba(225, 29, 72, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(225, 29, 72, 0.6)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
