import { useColorScheme, type ViewStyle } from 'react-native';

// Sombras del design system. Sólo en tema claro, salvo la del botón «Nuevo»: en oscuro separa `borde`.
const sombras = {
  tarjeta: { light: '0 2px 8px rgba(16, 40, 58, 0.08)', dark: null },
  flotante: { light: '0 6px 18px rgba(31, 108, 166, 0.35)', dark: '0 6px 18px rgba(0, 0, 0, 0.5)' },
};

export function useSombra(nombre: keyof typeof sombras): ViewStyle | undefined {
  const sombra = sombras[nombre][useColorScheme() === 'dark' ? 'dark' : 'light'];
  return sombra ? { boxShadow: sombra } : undefined;
}
