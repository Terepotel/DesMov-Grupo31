import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import { estadosReporte } from '@/componentes/ui/estado-reporte';
import { Icono, type NombreIcono } from '@/componentes/ui/icono';
import type { Reporte, TipoDeReporte } from '@/tipos';

type Props = {
  reporte: Reporte;
  /** `null` mientras no llegó el catálogo: ícono neutro. */
  tipo: TipoDeReporte | null;
  elegido?: boolean;
  onPress?: () => void;
};

// Anillo y fondo del color del estado; el ícono del tipo encima (el color del tipo no se usa: DS).
const bordes: Record<Reporte['estado'], string> = {
  recibido: 'border-estado-recibido',
  en_revision: 'border-estado-revision',
  asignado: 'border-estado-asignado',
  resuelto: 'border-estado-resuelto',
  rechazado: 'border-estado-rechazado',
};

// En Android el marcador se convierte en imagen. Si se congela antes de que la vista se acomode y
// la fuente de Ionicons pinte el glifo, queda el pin rojo de Google o un disco vacío
// (react-native-maps#5728). Se lo deja redibujar este tiempo después del último cambio visual o del
// último acomodo de la vista, y recién ahí se congela.
const ESPERA_DIBUJO_MS = 700;

/**
 * Un reporte en el mapa: un color por estado (R3.1) y el ícono del tipo. Nunca dice quién lo hizo.
 * La `key` tiene que ser el id del reporte y nada más: volver a montar el marcador crea otro
 * nativo, que arranca con el pin rojo hasta que se le asigna la imagen. Los cambios de estado, tipo
 * y `elegido` se redibujan acá adentro.
 */
export function MarcadorReporte({ reporte, tipo, elegido = false, onPress }: Props) {
  const estilo = estadosReporte[reporte.estado];
  const nombre = tipo?.nombre ?? 'Reporte';

  // Lo que se dibuja; cuando cambia, se vuelve a seguir la vista hasta que se asiente.
  const firma = `${reporte.estado}|${tipo?.icono ?? ''}|${elegido}`;
  const [acomodos, setAcomodos] = useState(0);
  const [firmaDibujada, setFirmaDibujada] = useState<string | null>(null);
  const dibujando = firmaDibujada !== firma;

  useEffect(() => {
    const temporizador = setTimeout(() => setFirmaDibujada(firma), ESPERA_DIBUJO_MS);
    return () => clearTimeout(temporizador);
  }, [firma, acomodos]);

  return (
    <Marker
      coordinate={{
        latitude: reporte.coordenadas.latitud,
        longitude: reporte.coordenadas.longitud,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={dibujando}
      onPress={onPress}
      accessibilityLabel={`${nombre}, ${reporte.direccion}, ${estilo.texto}`}
      zIndex={elegido ? 1 : 0}>
      <View
        onLayout={() => setAcomodos((n) => n + 1)}
        className={`items-center justify-center rounded-full ${estilo.fondo} ${bordes[reporte.estado]} ${
          elegido ? 'h-14 w-14 border-4' : 'h-11 w-11 border-[3px]'
        }`}>
        <Icono
          nombre={(tipo?.icono ?? 'help-circle-outline') as NombreIcono}
          tamano={elegido ? 28 : 22}
          className={estilo.claseIcono}
        />
      </View>
    </Marker>
  );
}
