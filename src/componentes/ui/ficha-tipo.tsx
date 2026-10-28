import { Pressable, View } from 'react-native';

import type { TipoDeReporte } from '@/tipos';

import { DiscoTipo } from './disco-tipo';
import { Texto } from './texto';

type Props = {
  tipo: TipoDeReporte;
  elegida: boolean;
  alElegir: () => void;
};

/**
 * Para elegir qué problema se reporta: van en dos columnas. El color del tipo sólo tiñe el disco;
 * elegida se marca con el borde `primario` de 3px y el fondo `superficie-alt`, no con color.
 */
export function FichaTipo({ tipo, elegida, alElegir }: Props) {
  return (
    <Pressable
      onPress={alElegir}
      className={`min-h-[72px] flex-1 flex-row items-center gap-3 rounded-lg px-3 py-2 active:opacity-70 ${elegida ? 'border-[3px] border-primario bg-superficie-alt' : 'border-2 border-borde-control bg-superficie'}`}
      accessibilityRole="button"
      accessibilityLabel={tipo.nombre}
      accessibilityState={{ selected: elegida }}>
      <DiscoTipo tipo={tipo} tamano={40} />
      <Texto variante="cuerpo-fuerte" numberOfLines={2} className="flex-1">
        {tipo.nombre}
      </Texto>
    </Pressable>
  );
}

/** Mientras llega el catálogo: fichas vacías del mismo tamaño. */
export function FichaTipoCargando() {
  return (
    <View
      className="min-h-[72px] flex-1 flex-row items-center gap-3 rounded-lg border-2 border-borde bg-superficie px-3"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <DiscoTipo tipo={null} tamano={40} />
      <View className="h-4 flex-1 rounded-full bg-superficie-alt" />
    </View>
  );
}
