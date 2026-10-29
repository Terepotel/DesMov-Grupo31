import { Linking, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';

type Props = {
  /** `false` si el vecino negó el permiso para siempre: sólo queda la configuración del teléfono. */
  puedePreguntar: boolean;
  /** Para volver a pedir el permiso desde acá. Sin esto, se pide al tocar «Sacar una foto». */
  alPedirPermiso?: () => void;
  /** Para qué se pide: la foto del reporte del vecino (sin ella no hay reporte) o la del arreglo. */
  motivo?: 'reporte' | 'arreglo';
};

const textos = {
  reporte: {
    titulo: 'Necesitamos la cámara para que puedas reportar.',
    detalle: 'Sin foto no hay reporte.',
  },
  arreglo: {
    titulo: 'Necesitamos la cámara para la foto del arreglo.',
    detalle: 'También podés elegirla de la galería.',
  },
};

/** Sin permiso de cámara no hay reporte (NF3): se explica con buenos modos y se ofrece la salida. */
export function AvisoSinCamara({ puedePreguntar, alPedirPermiso, motivo = 'reporte' }: Props) {
  const texto = textos[motivo];
  return (
    <View className="gap-3">
      <Aviso
        tono="atencion"
        icono="camera-outline"
        titulo={texto.titulo}
        detalle={
          puedePreguntar
            ? `${texto.detalle} Cuando el teléfono te pregunte, tocá «Permitir».`
            : `${texto.detalle} Podés darle permiso desde la configuración del teléfono.`
        }
      />
      {puedePreguntar ? (
        alPedirPermiso && (
          <Boton
            texto="Dar permiso a la cámara"
            variante="secundario"
            icono="camera-outline"
            onPress={alPedirPermiso}
          />
        )
      ) : (
        <Boton
          texto="Abrir la configuración"
          variante="secundario"
          icono="settings-outline"
          onPress={() => void Linking.openSettings()}
        />
      )}
    </View>
  );
}
