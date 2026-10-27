import { forwardRef } from 'react';
import { useColorScheme } from 'react-native';
import MapView, { type MapViewProps } from 'react-native-maps';

import { REGION_CIUDAD } from '@/utilidades/geo';

/**
 * El mapa de la app, con lo común a todas las pantallas: Google Maps en Android (clave en
 * `app.config.ts`), Apple Maps en iOS, tema según el sistema, sin controles del proveedor
 * (los botones son nuestros, con texto). Arranca en la ciudad si no se le pasa otra región.
 *
 * Pendiente (consignas §8.1 P3): la capa `LocalTile` con las teselas empaquetadas para que se vea
 * igual sin señal. Va acá adentro cuando estén generadas.
 */
export const MapaBase = forwardRef<MapView, MapViewProps>(function MapaBase(
  { children, ...props },
  ref,
) {
  const esquema = useColorScheme();

  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      initialRegion={REGION_CIUDAD}
      userInterfaceStyle={esquema === 'dark' ? 'dark' : 'light'}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      moveOnMarkerPress={false}
      {...props}>
      {children}
    </MapView>
  );
});
