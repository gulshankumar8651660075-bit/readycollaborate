/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep premium workspace palette
        workspace: {
          50: '#F5F7FA',
          100: '#E4E8F0',
          200: '#C9D1E0',
          300: '#9FADC6',
          400: '#6F83A8',
          500: '#4D628B',
          600: '#3D4F72',
          700: '#32405D',
          800: '#1D2433', // Deep slate primary
          900: '#0F131C', // Dark background
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
