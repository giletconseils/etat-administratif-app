import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CURSOR-inspired color palette - Dark Theme
        cursor: {
          // Background colors
          bg: {
            primary: "#0A0A0A",    // Main background - deep black
            secondary: "#121212",  // Card backgrounds
            tertiary: "#1A1A1A",   // Elevated surfaces
            elevated: "#1E1E1E",   // Highest elevation
          },
          // Text colors
          text: {
            primary: "#E5E5E5",    // Main text - bright white
            secondary: "#A0A0A0",  // Secondary text
            muted: "#6B6B6B",      // Muted text
          },
          // Accent colors
          accent: {
            blue: "#4A90E2",       // Primary accent blue
            blueHover: "#3A7BC8",  // Blue hover state
            button: "#708DAA",     // Button color from Cursor
            buttonHover: "#5A7A9A", // Button hover state
            green: "#22C55E",      // Success green
            red: "#EF4444",        // Error red
            orange: "#F97316",     // Warning orange
          },
          // Border colors - subtle
          border: {
            primary: "#2A2A2A",    // Main borders - very subtle
            secondary: "#333333",  // Secondary borders
            accent: "#404040",     // Accent borders
          },
          // Interactive states
          interactive: {
            hover: "#1E1E1E",      // Hover background
            active: "#252525",     // Active background
            disabled: "#0F0F0F",   // Disabled background
          }
        },
        // FairFair brand colors
        fairfair: {
          blue: {
            DEFAULT: "#00A7E1",    // Bleu principal FairFair
            hover: "#0090C4",      // Bleu hover FairFair
            dark: "#007BA8",       // Bleu foncé FairFair
          },
          orange: "#F47920",       // Orange FairFair
          pink: "#E94CA6",         // Rose FairFair
          green: "#8DC63F",        // Vert FairFair
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      boxShadow: {
        'cursor': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'cursor-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stepper-ping': 'stepperPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'stepper-glow': 'stepperGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stepperPing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.3)', opacity: '0.4' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        stepperGlow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
