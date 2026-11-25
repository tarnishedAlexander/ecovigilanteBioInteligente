/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: '#031a14',
          card: '#082820',
          border: '#114a3b',
          glow: '#10b981',
          accent: '#34d399',
        }
      }
    },
  },
  plugins: [],
}
