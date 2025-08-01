/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rajdhani", "system-ui", "sans-serif"],
        mono: ["Space Mono", "monospace"],
        retro: ["Orbitron", "sans-serif"],
      },
      colors: {
        gray: {
          950: "#0a0a0f",
        },
        neon: {
          pink: "#ff006e",
          purple: "#8338ec",
          blue: "#3a86ff",
          cyan: "#06ffa5",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        neon: "0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.1)",
        "neon-pink": "0 0 20px rgba(255, 0, 110, 0.4)",
        "neon-blue": "0 0 20px rgba(58, 134, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
