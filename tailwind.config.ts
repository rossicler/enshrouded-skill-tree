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
    },
  },
  plugins: [],
};
export default config;
