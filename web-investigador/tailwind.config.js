/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        // Neutrals: warm paper and soil-toned ink
        paper: '#F5F3EC',
        surface: '#FFFFFF',
        line: '#E3DFD3',
        'line-strong': '#CFC9B8',
        ink: {
          DEFAULT: '#1E2721',
          2: '#4A554D',
          3: '#7A837B',
        },
        // Brand: forest canopy
        forest: {
          50: '#EEF3EC',
          100: '#DCE7D8',
          500: '#3F6B47',
          600: '#2F5838',
          700: '#25472D',
        },
        // Hydrography
        water: { DEFAULT: '#3B7197', light: '#E6EEF3' },
        // Signal colors drawn from earth pigments
        ochre: { DEFAULT: '#A97A22', bg: '#F6EDD9' },
        clay: { DEFAULT: '#A9472F', bg: '#F5E3DC' },
        moss: { DEFAULT: '#5A7F3C', bg: '#E8EFDF' },
        rust: { DEFAULT: '#7E2A1E', bg: '#EFDCD7' },
        stone: { DEFAULT: '#8B8F86', bg: '#ECECE7' },
      },
    },
  },
  plugins: [],
};
