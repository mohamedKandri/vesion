import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        surface: {
          DEFAULT: '#0a0a12',
          raised: '#12121e',
          overlay: '#1a1a2a',
          border: '#26263a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
        'hero-glow':
          'radial-gradient(60% 50% at 50% 0%, rgba(99,102,241,0.22) 0%, rgba(124,58,237,0.10) 45%, transparent 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(99, 102, 241, 0.35)',
        'glow-sm': '0 0 20px rgba(124, 58, 237, 0.25)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(60px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-40px, 30px) scale(0.95)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        float: 'float 7s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
