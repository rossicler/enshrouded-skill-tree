/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
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
