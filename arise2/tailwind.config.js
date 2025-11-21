/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#0b0d19',
        'panel-bg': '#0e0f1a',
        'neon-cyan': '#00b8ff',
        'cyan-400': '#4be8ff',
        'soft-gray': '#a0a0a0',
        'card-bg': '#0e0f1a',
        'glow-cyan': '#00b8ff',
      },
      fontFamily: {
        game: ['Oxanium', 'Rajdhani', 'Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'glow-light': '0 0 12px rgba(0, 184, 255, 0.5)',
        'glow-hover': '0 0 35px rgba(0, 232, 255, 0.45)',
        'inner-glow': 'inset 0 0 20px rgba(0, 184, 255, 0.3)',
        'pulse-glow': '0 0 0 0 rgba(0, 184, 255, 0.7)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'spin-slow': 'spin 20s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-pulse': 'borderPulse 3s ease-in-out infinite',
        'achievement-slide': 'achievementSlide 0.8s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 184, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 232, 255, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        borderPulse: {
          '0%': { borderColor: 'rgba(0, 184, 255, 0.4)' },
          '50%': { borderColor: 'rgba(75, 232, 255, 0.8)' },
          '100%': { borderColor: 'rgba(0, 184, 255, 0.4)' },
        },
        achievementSlide: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
