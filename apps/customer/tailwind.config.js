/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
            'primary': '#C2D1F4', // Example custom color
            'secondary': '#add8e6',
            'yellow': '#F7C000'
          },
    },
  },
  plugins: [],
}

