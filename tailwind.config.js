/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        iuc: {
          blue: '#003B7E',
          gold: '#E8A020',
          light: '#F5F7FA',
          // Accent de l'école SEAS : orange du logo (#F3930F) assombri pour rester lisible sur blanc
          seas: '#AA670A',
        },
      },
    },
  },
  plugins: [],
}
