import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, {
  Marker,
  type MapPressEvent,
  type MarkerDragStartEndEvent,
} from 'react-native-maps';

import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import type { Coordenadas } from '@/tipos';
import { regionAlrededorDe } from '@/utilidades/geo';

import { MapaBase } from './mapa-base';

type Props = {
  /** Dónde está el punto ahora. `null` si todavía no hay ninguno (sin GPS: NF4). */
  coordenadas: Coordenadas | null;
  /** Se llama al soltar el punto o al tocar el mapa. */
  alCambiar: (coordenadas: Coordenadas) => void;
  /** Muestra el punto azul del teléfono, si hay permiso. */
  mostrarMiUbicacion?: boolean;
};

/**
 * El mapa para poner o corregir el punto de un reporte (R1.4): se arrastra el marcador o se toca
 * el lugar. Sin gestos escondidos: tocar también mueve el punto. Quien lo usa pone alrededor los
 * botones «Usar mi ubicación» y «Confirmar ubicación».
 */
export function SelectorUbicacion({ coordenadas, alCambiar, mostrarMiUbicacion = false }: Props) {
  const mapa = useRef<MapView>(null);
  // Si el punto lo movió el vecino sobre el mapa, el mapa no se mueve solo. Si lo cambió un botón
  // de afuera («Usar mi ubicación»), el mapa va hasta ahí.
  const ultimoDelMapa = useRef<Coordenadas | null>(null);

  useEffect(() => {
    if (!coordenadas || coordenadas === ultimoDelMapa.current) return;
    mapa.current?.animateToRegion(regionAlrededorDe(coordenadas));
  }, [coordenadas]);

  function moverA(evento: MapPressEvent | MarkerDragStartEndEvent) {
    const { latitude, longitude } = evento.nativeEvent.coordinate;
    const nuevas = { latitud: latitude, longitud: longitude };
    ultimoDelMapa.current = nuevas;
    alCambiar(nuevas);
  }

  return (
    <View className="flex-1 overflow-hidden rounded-lg border border-borde">
      <MapaBase
        ref={mapa}
        initialRegion={coordenadas ? regionAlrededorDe(coordenadas) : undefined}
        onPress={moverA}
        showsUserLocation={mostrarMiUbicacion}>
        {coordenadas && (
          <Marker
            coordinate={{ latitude: coordenadas.latitud, longitude: coordenadas.longitud }}
            draggable
            onDragEnd={moverA}
            anchor={{ x: 0.5, y: 1 }}
            accessibilityLabel="Punto del reporte. Arrastralo hasta el lugar exacto."
            tracksViewChanges={false}>
            <Icono nombre="location" tamano={48} className="text-primario" />
          </Marker>
        )}
      </MapaBase>
      <View
        className="absolute bottom-0 left-0 right-0 bg-superficie/90 px-4 py-2"
        accessibilityLiveRegion="polite">
        <Texto variante="secundario" className="text-center">
          {coordenadas
            ? 'Arrastrá el punto o tocá el lugar exacto del problema.'
            : 'Tocá en el mapa el lugar exacto del problema.'}
        </Texto>
      </View>
    </View>
  );
}
