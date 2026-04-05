/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C2D1F4', // existing
        secondary: '#add8e6', // existing
        yellow: '#F7C000', // existing
        'blue-pastel': {
          50: '#f0f7ff',
          100: '#e0f0fe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a9f6',
          500: '#0c8ceb',
          600: '#006ecb',
        }
      }
    }
  },
  plugins: []
}
