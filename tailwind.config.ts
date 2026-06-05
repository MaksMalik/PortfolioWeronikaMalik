import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101010",
        graphite: "#2d2d2d",
        silver: "#b8b8b8",
        porcelain: "#f8f7f4",
        mist: "#ecebe7"
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "Arial", "sans-serif"]
      },
      boxShadow: {
        editorial: "0 28px 80px rgba(16, 16, 16, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
