/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg':     'var(--bg)',
        'dark-2':      'var(--bg-2)',
        'dark-3':      'var(--bg-3)',
        'dark-card':   'var(--bg-card)',
        'dark-border': 'var(--border)',
        'dark-hover':  'var(--bg-hover)',
        'ink':         'var(--ink)',
        'ink-2':       'var(--ink-2)',
        'ink-dim':     'var(--ink-dim)',
        'ink-faint':   'var(--ink-faint)',
        'accent':      'var(--accent)',
      },
      fontFamily: {
        'display': ['var(--font-display)', 'sans-serif'],
        'mono': ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #0e0e0e 0%, #161616 50%, #0e0e0e 100%)',
      },
    },
  },
  plugins: [],
};
