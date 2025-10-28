/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef8e7',
          100: '#fdefc3',
          200: '#fbe29b',
          300: '#f9d572',
          400: '#f7ca54',
          500: '#f5bf36',
          600: '#f4b930',
          700: '#f2b029',
          800: '#f0a822',
          900: '#ee9916',
        },
      },
    },
  },
  plugins: [],
}