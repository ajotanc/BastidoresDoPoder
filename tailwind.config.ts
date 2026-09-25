import type { Config } from 'tailwindcss';
import { THEME_COLORS, ROLE_THEME_COLORS } from './src/constants/themeColors';

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
          DEFAULT: THEME_COLORS.paper,
          deep: '#060a0e',
        },
        surface: {
          DEFAULT: THEME_COLORS.surface,
          elevated: THEME_COLORS.surfaceElevated,
          hover: THEME_COLORS.surfaceHover,
          card: '#efe9d9',
        },
        ink: {
          DEFAULT: THEME_COLORS.ink,
          muted: THEME_COLORS.muted,
          subtle: THEME_COLORS.subtle,
          dark: '#20242a',
        },
        line: {
          DEFAULT: THEME_COLORS.line,
          subtle: '#1d2731',
          gold: THEME_COLORS.lineGold,
          'gold-accent': THEME_COLORS.goldDark,
        },
        gold: {
          DEFAULT: THEME_COLORS.gold,
          light: THEME_COLORS.goldLight,
          muted: THEME_COLORS.goldMuted,
          dark: THEME_COLORS.goldDark,
          deep: THEME_COLORS.lineGold,
        },
        status: {
          green: THEME_COLORS.statusGreen,
          'green-bg': THEME_COLORS.statusGreenBg,
          'green-border': '#3a5f53',
          red: THEME_COLORS.statusRed,
          'red-bg': THEME_COLORS.statusRedBg,
          'red-border': '#704649',
        },
        role: ROLE_THEME_COLORS
      },
      fontFamily: {
        serif: ['"Cinzel"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.625' }],
        sm: ['0.875rem', { lineHeight: '1.625' }],
        base: ['1rem', { lineHeight: '1.625' }],
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
