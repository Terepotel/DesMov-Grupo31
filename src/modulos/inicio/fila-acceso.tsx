import { Pressable, View } from 'react-native';

import { Icono, type NombreIcono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';

type Props = {
  icono: NombreIcono;
  titulo: string;
  /** Qué se encuentra del otro lado, en una frase. */
  detalle: string;
  alTocar: () => void;
};

/** Un acceso a otra parte de la app desde el inicio. */
export function FilaAcceso({ icono, titulo, detalle, alTocar }: Props) {
  return (
    <Pressable
      onPress={alTocar}
      className="min-h-toque flex-row items-center gap-4 rounded-lg border border-borde bg-superficie p-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={detalle}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-superficie-alt">
        <Icono nombre={icono} className="text-primario" />
      </View>
      <View className="flex-1 gap-1">
        <Texto variante="cuerpo-fuerte">{titulo}</Texto>
        <Texto variante="secundario">{detalle}</Texto>
      </View>
      <Icono nombre="chevron-forward" className="text-texto-secundario" />
    </Pressable>
  );
}
