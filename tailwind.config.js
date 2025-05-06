/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use Inter variable font for primary typography, fallback to IBM Plex Sans and Arial
        sans: ['Inter var', 'Inter', 'IBM Plex Sans', 'Arial', 'sans-serif'],
      },
      colors: {
        'playground-bg': '#0D0D0D',
        'playground-sidebar': '#171717',
        'playground-border': '#2D2D2D',
        'playground-button': '#10A37F',
        'playground-button-hover': '#0D856A',
        'docs-bg': '#0D1117',
        'docs-sidebar': '#161B22',
        'docs-sidebar-active': '#21262D',
        // Primary text color for documentation, matching platform.openai.com
        'docs-text': '#E7E9EB',
        'docs-accent': '#2F81F7',
        'docs-section': '#161B22',
        'docs-section-border': '#21262D',
        // Secondary (muted) text color
        'docs-muted': '#A3A3A3',
        'pastel-blue': '#BFDBFE',
        'pastel-blue-dark': '#1E3A8A',
        'pastel-blue-hover': '#93C5FD',
      },
    },
  },
  plugins: [],
} 