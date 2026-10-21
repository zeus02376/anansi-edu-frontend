/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        iuc: {
          // Couleurs extraites du vrai logo IUC (src/assets/logos/iuc.png), le 2026-10-21.
          // red : contraste 9,5:1 sur blanc (texte, ou fond avec texte blanc).
          // green : contraste 5,4:1 sur blanc (fond avec texte blanc ; jamais de texte rouge
          // ou vert sur l'autre couleur, le contraste n'est que de 1,8:1).
          red: '#8C120C',
          green: '#277A1D',
          light: '#F5F7FA',
          // Accent de l'école SEAS : orange du logo (#F3930F) assombri pour rester lisible sur blanc
          seas: '#AA670A',
        },
      },
    },
  },
  plugins: [],
}
