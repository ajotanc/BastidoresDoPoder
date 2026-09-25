import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#0b1219',
          deep: '#060a0e',
        },
        surface: {
          DEFAULT: '#131d27',
          elevated: '#17232e',
          hover: '#1e2c38',
          card: '#efe9d9',
        },
        ink: {
          DEFAULT: '#eee9dd',
          muted: '#adb5bb',
          subtle: '#8a9298',
          dark: '#20242a',
        },
        line: {
          DEFAULT: '#2b3540',
          subtle: '#1d2731',
          gold: '#514733',
          'gold-accent': '#8d784f',
        },
        gold: {
          DEFAULT: '#e6bf73',
          light: '#f5dcad',
          muted: '#ad9873',
          dark: '#8d784f',
          deep: '#514733',
        },
        status: {
          green: '#94c7b2',
          'green-bg': '#152b28',
          'green-border': '#3a5f53',
          red: '#eaa3a0',
          'red-bg': '#2d2028',
          'red-border': '#704649',
        },
        role: {
          coronel: '#d39071',
          executor: '#bf9955',
          intocavel: '#6ba292',
          advogado: '#c4ac7b',
          barao: '#e5a93c',
          marqueteiro: '#c67b93',
          investigador: '#7ba0c0',
          ajuda: '#e4c682',
        }
      },
      fontFamily: {
        serif: ['"Cinzel"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 16px 34px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 24px 44px rgba(0, 0, 0, 0.55)',
        modal: '0 35px 130px rgba(0, 0, 0, 0.85)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
      }
    },
  },
  plugins: [],
} satisfies Config;
