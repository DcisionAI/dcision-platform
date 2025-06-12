/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
          // Playground theme (dark)
          'playground-bg': '#0D0D0D',
          'playground-sidebar': '#171717',
          'playground-border': '#2D2D2D',
          'playground-button': '#10A37F',
          'playground-button-hover': '#0D856A',
          // Brand colors (light theme)
          'docs-bg': '#f4f1ea',           // page background
          'docs-sidebar': '#f4f1ea',      // sidebar and nav background
          'docs-sidebar-active': '#ede9dd',
          'docs-section': '#ede9dd',      // content cards background
          'docs-section-border': '#f4f1ea',
          'docs-text': '#18181b',         // primary text
          'docs-muted': '#4b5563',        // secondary text
          'docs-accent': '#e07a4a',       // accent color
          'docs-dark-bg': '#0D1117',      // dark mode background
          'docs-dark-text': '#E7E9EB',    // dark mode primary text
          'docs-dark-muted': '#8F959E',   // dark mode secondary text
          // Chat bubble backgrounds
          'brand-chat-bg': '#e5e7eb',
          'brand-chat-text': '#222222',
          // Alternative card backgrounds
          'brand-card-2': '#d6e4e0',
          'brand-card-3': '#d6d6e4',
          // Pastel blues (preserve)
          'pastel-blue': '#BFDBFE',
          'pastel-blue-dark': '#1E3A8A',
          'pastel-blue-hover': '#93C5FD',
        },
      },
  },
  plugins: [],
} 