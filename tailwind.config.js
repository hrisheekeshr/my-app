/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Figtree', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: '#14212b',
        accent: '#0f6e6a',
        paper: '#eef2f5',
      },
    },
  },
  plugins: [],
}

