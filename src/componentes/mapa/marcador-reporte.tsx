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

// En Android el marcador se convierte en imagen; si se congela antes de que la fuente de Ionicons
// pinte el glifo, queda el disco vacío. Se lo deja redibujar este tiempo y después se congela.
const ESPERA_DIBUJO_MS = 600;

/**
 * Un reporte en el mapa: un color por estado (R3.1) y el ícono del tipo. Nunca dice quién lo hizo.
 * Quien lo usa le pone una `key` que cambie con el estado, el tipo y `elegido`, para que se
 * vuelva a dibujar cuando cambie algo de eso.
 */
export function MarcadorReporte({ reporte, tipo, elegido = false, onPress }: Props) {
  const estilo = estadosReporte[reporte.estado];
  const nombre = tipo?.nombre ?? 'Reporte';
  const [dibujando, setDibujando] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => setDibujando(false), ESPERA_DIBUJO_MS);
    return () => clearTimeout(temporizador);
  }, []);

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
