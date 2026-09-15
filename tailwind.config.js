/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // safety net for future restructuring
  ],
  theme: {
    extend: {
      colors: {
        // Brand orange — full shade scale so hover/focus states have names
        brand: {
          50:  '#FFF4EC',
          100: '#FEE4CE',
          200: '#FDC79D',
          300: '#FBA96C',
          400: '#F89143',
          500: '#F47B20', // ← primary
          600: '#E06B10', // hover state (replaces hardcoded #E06B10)
          700: '#B8540A',
          800: '#8C3F07',
          900: '#5E2A04',
        },
        // Dark slate — your secondary / text / footer color
        slate: {
          50:  '#F8F9FA', // ← the "light gray" from your brand sheet
          100: '#EAEEF2',
          200: '#D3DBE3',
          300: '#A9B7C6',
          400: '#7589A0',
          500: '#4E6280',
          600: '#3A4E6B',
          700: '#2C3E50', // ← primary dark
          800: '#1F2C3A',
          900: '#131B25',
        },
      },
      fontFamily: {
        // Ready for a custom font (Inter, Manrope, etc.). Falls back to
        // the system stack today.
        sans: [
          'var(--font-sans, ui-sans-serif)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        // Replaces the repeated `max-w-6xl` on every section
        content: '72rem', // 1152px — matches max-w-6xl
      },
      boxShadow: {
        // A softer, more premium card shadow than Tailwind's default shadow-lg
        card: '0 4px 24px -8px rgb(44 62 80 / 0.08)',
        'card-hover': '0 12px 32px -8px rgb(44 62 80 / 0.12)',
      },
    },
  },
  plugins: [],
};
