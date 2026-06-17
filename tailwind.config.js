/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        indigo: {
          950: '#0B1C33',
          900: '#122744',
          800: '#1A3356',
          700: '#1E3A5F',
          600: '#264B7A',
          500: '#2E5C96',
        },
        electric: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        success: {
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          500: '#F43F5E',
          600: '#E11D48',
        },
        graphite: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        canvas: '#F1F5F9',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'node': '0 4px 20px rgba(30, 58, 95, 0.12)',
        'node-active': '0 8px 30px rgba(59, 130, 246, 0.25)',
        'panel': '0 4px 24px rgba(15, 23, 42, 0.08)',
        'glass': '0 8px 32px rgba(30, 58, 95, 0.12)',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
        'hero-gradient': 'linear-gradient(135deg, #1E3A5F 0%, #122744 50%, #0B1C33 100%)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 200ms ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
          '70%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
