/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        app: 'rgb(var(--color-app) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        soft: 'rgb(var(--color-soft) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-text-subtle) / <alpha-value>)',
          inverted: 'rgb(var(--color-text-inverted) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-primary-muted) / <alpha-value>)',
          text: 'rgb(var(--color-primary-text) / <alpha-value>)',
          contrast: 'rgb(var(--color-primary-contrast) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
          text: 'rgb(var(--color-warning-text) / <alpha-value>)',
        },
        brand: {
          50: 'rgb(var(--color-primary-muted) / <alpha-value>)',
          100: 'rgb(var(--color-primary-soft) / <alpha-value>)',
          200: 'rgb(var(--color-primary-soft) / <alpha-value>)',
          300: 'rgb(var(--color-primary) / <alpha-value>)',
          400: 'rgb(var(--color-primary) / <alpha-value>)',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary) / <alpha-value>)',
          700: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          800: 'rgb(var(--color-primary-text) / <alpha-value>)',
          900: 'rgb(var(--color-primary-muted) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
