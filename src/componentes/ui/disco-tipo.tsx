import { View } from 'react-native';

import type { TipoDeReporte } from '@/tipos';

import { Icono, type NombreIcono } from './icono';

type Props = {
  /** `null` mientras no llegó el catálogo: disco neutro. */
  tipo: TipoDeReporte | null;
  tamano?: number;
};

/**
 * El color del tipo viene de la API y no siempre contrasta: sólo tiñe el disco (18 %, sufijo `2E`)
 * y su anillo. El ícono va siempre en `texto`.
 */
export function DiscoTipo({ tipo, tamano = 48 }: Props) {
  return (
    <View
      className={`items-center justify-center rounded-full ${tipo ? '' : 'border-2 border-borde bg-superficie-alt'}`}
      style={[
        { width: tamano, height: tamano },
        tipo && { backgroundColor: `${tipo.color}2E`, borderColor: tipo.color, borderWidth: 2 },
      ]}>
      <Icono
        nombre={(tipo?.icono ?? 'help-circle-outline') as NombreIcono}
        tamano={Math.round(tamano / 2)}
        className="text-texto"
      />
    </View>
  );
}
