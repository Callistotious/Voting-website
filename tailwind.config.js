/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#0A0E1A",
          900: "#0D1324",
          800: "#121A33",
          700: "#1B2747",
          600: "#263563"
        },
        gold: {
          400: "#E9C77B",
          500: "#D9B35E",
          600: "#BD9440"
        },
        ivory: "#F3EFE6",
        parchment: "#EDE7D8"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        none: "0px"
      }
    }
  },
  plugins: []
};
