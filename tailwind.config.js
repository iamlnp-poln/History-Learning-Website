
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'history-gold': '#d4af37',
        'history-paper': '#fdfbf7',
        'history-dark': '#2c241b',
        'history-red': '#8a1c1c',
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'blur-in': 'blurIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'blob': 'blob 7s infinite',
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        blurIn: {
          '0%': { opacity: 0, filter: 'blur(10px)', transform: 'translateY(-20px)' },
          '100%': { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(30px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' }
        },
        popIn: {
          '0%': { opacity: 0, transform: 'scale(0.9) translateY(10px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(10px)' }
        }
      }
    },
  },
  plugins: [],
}