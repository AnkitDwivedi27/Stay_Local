/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2F7F4',
          100: '#E1ECE6',
          200: '#C3D9CD',
          300: '#9EBFB0',
          400: '#5C8E77',
          500: '#346A52',
          600: '#234E3C',
          700: '#1E3A2F', // Primary brand green
          800: '#172E25',
          900: '#10211A',
          950: '#0B1712',
        },
        clay: {
          50: '#FDF7F4',
          100: '#FAEDE7',
          200: '#F4D8CC',
          300: '#EABCA9',
          400: '#DC9679',
          500: '#C06C4E', // Warm clay accent
          600: '#B0593B',
          700: '#92462C',
          800: '#753723',
          900: '#5F2D1D',
        },
        mountain: {
          50: '#F4F7F9',
          100: '#E6EDF2',
          200: '#D1DEE6',
          300: '#B0C5D3',
          400: '#7B9EB5',
          500: '#4A6B82', // Muted mountain blue
          600: '#3C596E',
          700: '#304758',
          800: '#263845',
          900: '#1C2933',
        },
        sand: {
          50: '#FAF8F4',
          100: '#F5F0E6',
          200: '#EBE3D5',
          300: '#DDD2C0',
          400: '#C8BAA3',
          500: '#B0A088',
        },
        charcoal: {
          50: '#F6F7F7',
          100: '#EBECEB',
          200: '#D4D7D5',
          300: '#ACB1AE',
          400: '#7C837E',
          500: '#555C57',
          600: '#3F4641',
          700: '#2E3430',
          800: '#212723',
          900: '#161A17',
          950: '#0F1210',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
