/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6fdf2',
          100: '#ccfbe6',
          200: '#99f5cd',
          300: '#66eab4',
          400: '#33dfa0',
          500: '#00d084',
          600: '#00b573',
          700: '#00995f',
          800: '#007d4b',
          900: '#005c38',
          950: '#003d24',
        },
      },
    },
  },
  plugins: [],
};
