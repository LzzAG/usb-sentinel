/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sentinel-dark': '#0f172a', // Um azul bem escuro para o fundo
        'sentinel-card': '#1e293b', // Ligeiramente mais claro para cartões
        'sentinel-accent': '#3b82f6', // Azul destaque
      }
    },
  },
  plugins: [],
}