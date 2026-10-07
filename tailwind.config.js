/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nude: {
          50: '#FBF8F4',
          100: '#F5EEE4',
          200: '#EADFD1',
          300: '#D8C7B6',
          400: '#BFA893',
          500: '#8D7769',
          600: '#6B4A3B',
          700: '#4A3226',
          800: '#302824',
          900: '#1F1A17'
        },
        terracotta: {
          DEFAULT: '#A96555',
          soft: '#C08A7B'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(107, 74, 59, 0.25)',
        card: '0 4px 20px -8px rgba(48, 40, 36, 0.15)'
      }
    }
  },
  plugins: []
}
