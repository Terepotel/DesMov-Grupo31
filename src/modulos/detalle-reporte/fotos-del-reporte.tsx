import { Image } from 'expo-image';
import { View } from 'react-native';

import { DiscoTipo } from '@/componentes/ui/disco-tipo';
import type { Foto, TipoDeReporte } from '@/tipos';

type Props = {
  fotos: Foto[];
  tipo: TipoDeReporte | null;
  /** Para el lector de pantalla: «Foto del problema» → «Foto del problema 1 de 2». */
  rotulo: string;
};

/** Las fotos a todo el ancho, 4:3. El disco del tipo queda debajo: se ve mientras cargan o si fallan. */
export function FotosDelReporte({ fotos, tipo, rotulo }: Props) {
  return (
    <View className="gap-3">
      {fotos.map((foto, indice) => (
        <View
          key={foto.id}
          className="w-full items-center justify-center overflow-hidden rounded-lg bg-superficie-alt"
          style={{ aspectRatio: 4 / 3 }}>
          <DiscoTipo tipo={tipo} tamano={64} />
          <Image
            source={{ uri: foto.url }}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${rotulo} ${indice + 1} de ${fotos.length}`}
          />
        </View>
      ))}
    </View>
  );
}
