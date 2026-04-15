/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
      extend: {
        backgroundImage: {
          "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
          "gradient-conic":
            "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        },
        fontFamily: {
          sans: ["var(--font-inter)", "sans-serif"],
          heading: ["var(--font-outfit)", "sans-serif"],
        },
        colors: {
          slate: {
            950: "#020617",
            900: "#0f172a",
            800: "#1e293b",
            700: "#334155",
          },
        },
      },
    },
  plugins: [],
};
