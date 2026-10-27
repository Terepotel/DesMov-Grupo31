import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Los colores de la bandera son iguales en los dos temas: los mismos que `--color-bandera-*` de
// `src/global.css`. Van como prop `fill` porque react-native-svg no toma de forma pareja los `fill-*`.
const bandera = {
  verde: '#085E17',
  verdeMedio: '#4F8607',
  verdeClaro: '#AECB6E',
  arena: '#EEDF9C',
};

const fondos = {
  celeste: 'bg-bandera-celeste',
  verde: 'bg-bandera-verde',
};

type Props = PropsWithChildren<{
  /** Celeste en el ingreso; verde en el inicio del vecino y en la bandeja del operador. */
  tono: keyof typeof fondos;
  /** Alto de la barra de estado, cuando el encabezado llega hasta el borde superior. */
  margenSuperior?: number;
  className?: string;
}>;

/** Bloque de identidad de una pantalla, con la ola de la bandera al pie. Uno por pantalla. */
export function Encabezado({ tono, margenSuperior = 0, className, children }: Props) {
  return (
    <View className={`overflow-hidden ${fondos[tono]} ${className ?? ''}`}>
      <View
        className="items-start gap-3 px-6 pb-[72px]"
        style={{ paddingTop: 24 + margenSuperior }}>
        {children}
      </View>
      <Ola conLomaOscura={tono === 'celeste'} />
    </View>
  );
}

/** Las lomas y la franja arena de la bandera. Decorativa: no lleva texto encima. */
function Ola({ conLomaOscura }: { conLomaOscura: boolean }) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 h-14"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 400 56" preserveAspectRatio="none">
        <Path fill={bandera.verdeClaro} d="M0 30C60 10 140 12 210 34L210 56H0Z" />
        {conLomaOscura && <Path fill={bandera.verde} d="M110 56C200 28 300 4 400 12V56Z" />}
        <Path fill={bandera.arena} d="M0 42C90 30 210 36 310 56H0Z" />
        <Path
          fill={bandera.verdeMedio}
          d={
            conLomaOscura
              ? 'M0 46C20 48 40 52 56 56H0ZM270 56C320 46 370 42 400 45V56Z'
              : 'M0 46C20 48 40 52 56 56H0ZM200 56C280 36 350 30 400 34V56Z'
          }
        />
      </Svg>
    </View>
  );
}
