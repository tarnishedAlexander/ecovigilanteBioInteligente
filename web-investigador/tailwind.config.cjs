/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#151914', surface: '#252b22', line: '#42493d', 'line-strong': '#606957',
        ink: { DEFAULT: '#e8ebdd', 2: '#c3cbbb', 3: '#a9b5a0' },
        forest: { 50: '#293127', 100: '#343d2d', 500: '#a7be78', 600: '#bbd77a', 700: '#cbdf9f' },
        water: { DEFAULT: '#8baea4', light: '#283832' },
        ochre: { DEFAULT: '#d5ac69', bg: '#393123' },
        clay: { DEFAULT: '#df967e', bg: '#402d26' },
        moss: { DEFAULT: '#a7be78', bg: '#303925' },
        rust: { DEFAULT: '#e58b83', bg: '#412b28' },
        stone: { DEFAULT: '#afb6a5', bg: '#343a31' },
      },
    },
  },
  plugins: [],
};
