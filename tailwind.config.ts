import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ig-red": "#a11f1f",
        "ig-green": "#8ebe00",
        "ig-blue": "#0081dd",
        "ig-gold": "#ca9803",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      scale: {
        25: ".25",
      },
      dropShadow: {
        shiny: "0 0 3px rgb(192 132 252)",
      },
      keyframes: {
        "flame-radiance": {
          "0%, 100%": {
            boxShadow: [
              "0 0 16px 4px rgba(255,170,50,0.6)",
              "0 0 40px 12px rgba(255,120,20,0.35)",
              "0 0 72px 24px rgba(200,80,10,0.15)",
            ].join(", "),
          },
          "50%": {
            boxShadow: [
              "0 0 24px 8px rgba(255,190,70,0.7)",
              "0 0 56px 20px rgba(255,140,30,0.4)",
              "0 0 96px 36px rgba(200,80,10,0.2)",
            ].join(", "),
          },
        },
      },
      animation: {
        "flame-radiance": "flame-radiance 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
