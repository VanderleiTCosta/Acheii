// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores semânticas baseadas na logo Acheii
        brand: {
          'primary': '#06dc8b', // O verde vibrante principal da logo
          'dark': '#065554',    // O turquesa escuro profundo
          'mid': '#3fc995',     // Um verde médio, ótimo para destaques secundários
          'accent': '#a3f0d6',  // Um verde claro e suave para fundos de destaque
          'neutral': '#c0e3da', // Uma cor neutra clara e equilibrada
        },
        surface: {
          'light': '#f2fefc',   // Uma cor de superfície muito clara, perfeita para fundos limpos
        },
        // Cores para texto ou elementos secundários
        text: {
          'dark': '#497272',    // Um tom de turquesa escuro e suave para texto legível
          'light': '#7da1a0',   // Um tom de turquesa claro para texto de apoio
        },
      },
      fontFamily: {
        // Sugestão de fonte para um visual moderno e limpo
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config