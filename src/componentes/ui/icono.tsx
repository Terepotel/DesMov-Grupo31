import { Ionicons } from '@react-native-vector-icons/ionicons';
import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';

// El color del ícono sale de una clase `text-*`, igual que el del texto.
cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];

type Props = {
  nombre: NombreIcono;
  /** 24 junto a texto, 28 en la barra inferior. */
  tamano?: number;
  className?: string;
};

/** Íconos de Ionicons. Son decorativos: el texto de al lado (o el `accessibilityLabel`) dice qué son. */
export function Icono({ nombre, tamano = 24, className }: Props) {
  return (
    <Ionicons
      name={nombre}
      size={tamano}
      className={className}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
