// Tokens del design system «Reporte Ciudadano»: https://claude.ai/artifact/UvJjqzc26ffAa3UsJMZTVw
// Los colores son variables de `src/global.css`: cambian solos con el modo claro/oscuro del sistema.
const color = (variable) => `rgb(var(--color-${variable}) / <alpha-value>)`;

const colores = [
  'bandera-celeste',
  'bandera-verde',
  'bandera-verde-medio',
  'bandera-verde-claro',
  'bandera-arena',
  'sobre-celeste',
  'sobre-verde',
  'fondo',
  'superficie',
  'superficie-alt',
  'borde',
  'borde-control',
  'texto',
  'texto-secundario',
  'primario',
  'sobre-primario',
  'foco',
  'estado-recibido',
  'estado-recibido-fondo',
  'estado-revision',
  'estado-revision-fondo',
  'estado-asignado',
  'estado-asignado-fondo',
  'estado-resuelto',
  'estado-resuelto-fondo',
  'estado-rechazado',
  'estado-rechazado-fondo',
  'peligro',
  'peligro-fondo',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(colores.map((nombre) => [nombre, color(nombre)])),
      // En Android el peso de una fuente propia se elige por familia, no con `fontWeight`:
      // usar `font-sans-bold`, nunca `font-bold`. Los nombres son los que registra `useFonts`.
      fontFamily: {
        sans: ['AtkinsonHyperlegibleNext_400Regular'],
        'sans-bold': ['AtkinsonHyperlegibleNext_700Bold'],
        'sans-extrabold': ['AtkinsonHyperlegibleNext_800ExtraBold'],
        mono: ['AtkinsonHyperlegibleMono_700Bold'],
      },
      fontSize: {
        'titulo-pantalla': ['32px', { lineHeight: '38px', letterSpacing: '-0.32px' }],
        'titulo-seccion': ['24px', { lineHeight: '30px' }],
        'titulo-tarjeta': ['20px', { lineHeight: '26px' }],
        cuerpo: ['18px', { lineHeight: '27px' }],
        secundario: ['16px', { lineHeight: '24px' }],
        etiqueta: ['14px', { lineHeight: '20px', letterSpacing: '1.12px' }],
        rotulo: ['14px', { lineHeight: '18px' }],
        boton: ['20px', { lineHeight: '28px' }],
        campo: '20px',
        codigo: ['24px', { lineHeight: '30px' }],
      },
      // `rounded-sm|md|lg|xl` = `radio-sm|md|lg|xl` del design system.
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '28px',
      },
      minHeight: {
        toque: '56px',
        'toque-principal': '64px',
      },
    },
  },
  plugins: [],
};
