import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        focus: '0 0 0 4px rgba(255, 0, 0, 0.18)',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.2' },
        },
        blink: {
          '0%, 50%, 100%': { opacity: '1' },
          '25%, 75%': { opacity: '0' },
        },
      },
      animation: {
        pulseRed: 'pulseRed 1.8s ease-in-out infinite',
        blink: 'blink 1.2s step-start infinite',
      },
    },
  },
  plugins: [],
};

export default config;
