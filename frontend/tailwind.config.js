/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: 'var(--cyber-bg)',
          panel: 'var(--cyber-panel)',
          card: 'var(--cyber-card)',
          border: 'var(--cyber-border)',
          'border-bright': 'var(--cyber-primary)',
          primary: 'var(--cyber-primary)',
          'primary-dim': '#0891b2',
          secondary: 'var(--cyber-secondary)',
          accent: 'var(--cyber-accent)',
          danger: 'var(--cyber-danger)',
          warning: 'var(--cyber-warning)',
          text: 'var(--cyber-text)',
          'text-dim': 'var(--cyber-text-dim)',
          'text-bright': '#ffffff',
          glow: 'var(--glow-primary)',
          'glow-strong': 'var(--glow-primary)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', '"Segoe UI"', 'sans-serif'],
        cyber: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'cyber': '0 0 15px rgba(0, 212, 255, 0.15), 0 0 30px rgba(0, 212, 255, 0.05)',
        'cyber-lg': '0 0 30px rgba(0, 212, 255, 0.2), 0 0 60px rgba(0, 212, 255, 0.1)',
        'cyber-glow': '0 0 5px #00d4ff, 0 0 20px rgba(0, 212, 255, 0.3)',
        'neon-blue': '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 20px #00d4ff',
        'neon-green': '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff88',
        'neon-purple': '0 0 5px #7c3aed, 0 0 10px #7c3aed, 0 0 20px #7c3aed',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 4s linear infinite',
        'matrix-fall': 'matrixFall 10s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'typing': 'typing 3.5s steps(40, end), blink-caret .75s step-end infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2), 0 0 10px rgba(0, 212, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '1' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.33' },
        },
        matrixFall: {
          '0%': { transform: 'translateY(-100vh)', opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: '#00d4ff' },
        },
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
        'cyber-gradient': 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1321 100%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
};
