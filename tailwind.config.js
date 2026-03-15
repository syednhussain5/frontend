/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfc',
          400: '#8196f8',
          500: '#6271f1',
          600: '#4f55e5',
          700: '#4244ca',
          800: '#3739a3',
          900: '#313681',
          950: '#1e1f4b',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6010',
        },
        success: '#22c55e',
        danger:  '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'progress': 'progress 1s ease-in-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.9)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(98, 113, 241, 0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(98, 113, 241, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        progress: {
          from: { width: '0%' },
          to:   { width: 'var(--progress-width)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,.08), 0 4px 24px rgba(0,0,0,.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,.1), 0 8px 32px rgba(0,0,0,.08)',
        'glow': '0 0 24px rgba(98,113,241,.35)',
      },
    },
  },
  plugins: [],
}
