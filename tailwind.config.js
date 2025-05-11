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
        // Use OpenAI Sans for primary typography, fallback to Inter and others
        sans: ["'OpenAI Sans'", 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
        colors: {
          'playground-bg': '#0D0D0D',
          'playground-sidebar': '#171717',
          'playground-border': '#2D2D2D',
          'playground-button': '#10A37F',
          'playground-button-hover': '#0D856A',
          // OpenAI Docs Dark theme colors
          'docs-bg': '#22272A',        // page background (under main overlay)
          // Main content overlay background
          'docs-main-bg': 'rgba(16,17,17,0.93)',
          'docs-sidebar': '#060606',   // sidebar and nav background (darker)
          'docs-sidebar-active': '#161B22',
          'docs-section': '#161B22',    // content cards background
          'docs-section-border': '#21262C',
          // Typography colors
          'docs-text': '#E7E9EB',       // primary text
          'docs-muted': '#8F959E',      // secondary text
          // Accent color (links, active states)
          'docs-accent': '#0A7CFF',
          'pastel-blue': '#BFDBFE',
          'pastel-blue-dark': '#1E3A8A',
          'pastel-blue-hover': '#93C5FD',
        },
      },
  },
  plugins: [],
} 