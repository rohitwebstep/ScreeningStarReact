/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    theme: {
      extend: {
        keyframes: {
          slideIn: {
            '0%': { transform: 'translateY(-100%)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
          slideOut: {
            '0%': { transform: 'translateY(0)', opacity: 1 },
            '100%': { transform: 'translateY(-100%)', opacity: 0 },
          }
        },
        animation: {
          slideIn: 'slideIn 0.5s ease-out',
          slideOut: 'slideOut 0.5s ease-in',
        }
      }
    },
    plugins: [],
  };
  