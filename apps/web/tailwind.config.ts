import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        // Green healthtech ramp
        'brand-green': 'var(--brand-green)',
        'brand-teal': 'var(--brand-teal)',
        'brand-mint': 'var(--brand-mint)',
        'brand-soft': 'var(--brand-soft)',
        'brand-deep': 'var(--brand-deep)',
        // Legacy aliases (mapped onto the green ramp in tokens.css)
        'brand-red': 'var(--brand-red)',
        'brand-orange': 'var(--brand-orange)',
        'brand-amber': 'var(--brand-amber)',
        'brand-gold': 'var(--brand-gold)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        // Theme-adaptive overlays (replace hardcoded white/x utilities)
        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '24px',
        '3xl': '36px',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
      },
      keyframes: {
        'kp-enter': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'kp-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.55' },
        },
      },
      animation: {
        'kp-enter': 'kp-enter 0.42s ease-out both',
        'kp-pulse': 'kp-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
