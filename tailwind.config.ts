import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        datum: {
          ink: "#06111f",
          panel: "#0b1d32",
          line: "#1f3854",
          cyan: "#16d9e6",
          soft: "#e9f7fb"
        }
      },
      boxShadow: {
        glow: "0 0 32px rgba(22, 217, 230, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
