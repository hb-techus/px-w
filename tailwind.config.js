/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'loading-bar': {
          '0%': { left: '-30%' },
          '50%': { left: '50%' },
          '100%': { left: '130%' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-in-out',
        'loading-bar': 'loading-bar 1.2s ease-in-out infinite',
      },
      fontFamily: {
        Poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  daisyui: {
    themes: ["light", "dark", "corporate"], // or your own theme config
    darkTheme: "dark",
  },
};
