// tailwind.config.js
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  darkMode: ['class', '.dark'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      screens: {
        tiny: '320px',
        'mobile-sm': '375px',
        mobile: '425px',
        tablet: '640px',
        'tablet-lg': '768px',
        'laptop-sm': '1024px',
        laptop: '1280px',
        desktop: '1440px',
        'desktop-lg': '1536px',
        ultra: '2560px',
      },
      animation: {
        gradient: 'gradientShift 15s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
      },
    },
    maxWidth: {
      '8xl': '1536px',
    },
  },
  plugins: [require('tailwindcss-primeui')],
}
