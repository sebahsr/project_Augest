import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  // content is optional in v4; keeping it is fine
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'shega-hero':
          'radial-gradient(circle at 20% 10%, rgba(56,189,248,.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(168,85,247,.20), transparent 35%), radial-gradient(circle at 50% 90%, rgba(251,191,36,.20), transparent 35%)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        shega: {
          primary: '#2563eb',
          secondary: '#22c55e',
          accent: '#a855f7',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          info: '#0ea5e9',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'light',
      'dark',
    ],
  },
}
