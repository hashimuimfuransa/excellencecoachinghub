/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        educational: {
          light: '#f0f9ff',
          DEFAULT: '#e0f2fe',
          dark: '#bae6fd',
        }
      },
      fontFamily: {
        'child-friendly': ['Comic Neue', 'cursive'],
        'rounded': ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'tilt': 'tilt 5s infinite ease-in-out',
        'float-3d': 'float3d 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'wiggle': 'wiggle 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotateY(0deg)' },
          '25%': { transform: 'rotateY(5deg)' },
          '75%': { transform: 'rotateY(-5deg)' },
        },
        'float-3d': {
          '0%': { transform: 'translateY(0px) translateZ(0px)' },
          '50%': { transform: 'translateY(-15px) translateZ(10px)' },
          '100%': { transform: 'translateY(0px) translateZ(0px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)' },
          '100%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.5)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}