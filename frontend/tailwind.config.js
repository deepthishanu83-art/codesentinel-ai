/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette
        surface: {
          50:  '#f4f6f9',
          100: '#e8edf3',
          200: '#c8d3e0',
          // Dark surfaces (primary usage range)
          700: '#1a1f2e',
          800: '#141824',
          850: '#10141e',
          900: '#0c0f18',
          950: '#080b12',
        },
        // Sidebar/panel surface
        panel: {
          DEFAULT: 'rgba(14, 18, 28, 0.85)',
          border: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.05)',
          active: 'rgba(20, 184, 166, 0.10)',
        },
        // Teal/cyan accent — primary interactive color
        teal: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        // Cyan for highlights/glows
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
        // Muted violet for depth
        violet: {
          800: '#3b2f6e',
          900: '#2d2255',
          950: '#1e1640',
        },
        // Severity scale
        severity: {
          critical: '#ef4444',
          high:     '#f97316',
          medium:   '#eab308',
          low:      '#22c55e',
          info:     '#3b82f6',
        },
        // Text hierarchy
        ink: {
          primary:   '#e2e8f0',
          secondary: '#94a3b8',
          tertiary:  '#64748b',
          muted:     '#475569',
          faint:     '#334155',
        },
        // Accent color aliases (used throughout components)
        accent: {
          teal:   '#2dd4bf',
          cyan:   '#06b6d4',
          violet: '#8b5cf6',
        },
        // Surface aliases for card/base/border patterns
        'surface-card':   '#141824',
        'surface-base':   '#0c0f18',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        // Glow effects
        'teal-glow':   '0 0 16px rgba(20, 184, 166, 0.18)',
        'cyan-glow':   '0 0 20px rgba(6, 182, 212, 0.15)',
        'violet-glow': '0 0 24px rgba(59, 47, 110, 0.35)',
        // Panel shadows
        'panel':       '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
        'panel-lg':    '0 4px 6px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)',
        // Inner border glow for active states
        'active-ring': 'inset 0 0 0 1px rgba(20, 184, 166, 0.3)',
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        sidebar: '220px',
        topbar:  '56px',
      },
      transitionDuration: {
        250: '250ms',
      },
      animation: {
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'drift-slow':   'drift 18s ease-in-out infinite',
        'drift-medium': 'drift 12s ease-in-out infinite',
        'drift-fast':   'drift 8s ease-in-out infinite',
        'fade-in':      'fadeIn 0.3s ease-out both',
        'fade-in-up':   'fadeInUp 0.4s ease-out both',
        'slide-in':     'slideIn 0.25s ease-out both',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%':      { transform: 'translate(-20px, 15px) scale(0.97)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
