import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#ea580c",
      },
    },
  },
  plugins: [],
};

export default config;
