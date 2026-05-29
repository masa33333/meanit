/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4EFE6",
        paper: "#FBF8F2",
        ink: "#2B2622",
        inkSoft: "#6A6058",
        partner: "#3F7A6D",
        partnerSoft: "#E4EFEA",
        coach: "#C26B4A",
        coachSoft: "#F6E7DD",
        gold: "#C9982F",
      },
      fontFamily: {
        display: ["'Shippori Mincho B1'", "serif"],
        sans: ["'Zen Kaku Gothic New'", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        coachIn: {
          from: { opacity: "0", transform: "translateY(-6px) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
        panelIn: {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "none" },
        },
        blink: {
          "0%,80%,100%": { opacity: "0.3", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-3px)" },
        },
        pulseMic: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(194,107,74,0.5)" },
          "50%": { boxShadow: "0 0 0 7px rgba(194,107,74,0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease both",
        coachIn: "coachIn 0.45s cubic-bezier(.2,.7,.3,1) both",
        panelIn: "panelIn 0.32s cubic-bezier(.2,.7,.3,1) both",
        pulseMic: "pulseMic 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
