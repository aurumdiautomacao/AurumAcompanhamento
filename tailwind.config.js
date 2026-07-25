/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fb',
          100: '#dbe7f3',
          200: '#bccfe6',
          300: '#8facd4',
          400: '#5b85bf',
          500: '#3a64a6',
          600: '#2c4d88',
          700: '#253e6e',
          800: '#223559',
          900: '#1f2e4a',
          950: '#161e30',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f5edd2',
          200: '#ecd9a0',
          300: '#e2c06a',
          400: '#d9a73f',
          500: '#cf9226',
          600: '#b3721b',
          700: '#8f541a',
          800: '#75421b',
          900: '#62381a',
          950: '#3a1f0c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
