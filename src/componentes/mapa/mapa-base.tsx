import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Dimensions, Platform, useColorScheme, View } from 'react-native';
import MapView, { LocalTile, type MapViewProps, type Region } from 'react-native-maps';

import { Texto } from '@/componentes/ui/texto';
import manifiesto from '@/assets/mapa/teselas.json';
import { useTeselasLocales } from '@/modulos/mapa/teselas-locales';
import { REGION_CIUDAD } from '@/utilidades/geo';

/**
 * El mapa de la app, con lo común a todas las pantallas: gestos, marcadores y «dónde estoy» los
 * pone el proveedor (Google Maps en Android, Apple Maps en iOS), sin sus controles (los botones son
 * nuestros, con texto). Arranca en la ciudad si no se le pasa otra región.
 *
 * El dibujo es siempre nuestro: la capa `LocalTile` con las teselas de la ciudad guardadas en el
 * teléfono (consignas §8.1 P3), en el tema del sistema, y en Android el proveedor no dibuja nada
 * (`mapType="none"`), así el mapa se ve igual con o sin señal. Como sólo hay teselas de la planta
 * urbana en zoom 13 a 17, el zoom y el paneo quedan acotados a eso. En iOS `none` no existe:
 * abajo sigue Apple Maps. Las teselas salen de OpenStreetMap, por eso la atribución.
 *
 * El paneo se acota a mano: `setMapBoundaries` de react-native-maps no está implementado en
 * Android con la arquitectura nueva (el `MapViewManager` de Fabric no lo tiene), así que si al
 * soltar la pantalla quedó asomando algo sin teselas, se la trae de vuelta. Se acota la región
 * visible entera (no sólo el centro) contra la caja que tiene teselas en el zoom actual: la ciudad
 * en 16 y 17, y los anillos de alrededores en 13 a 15, que son más grandes porque a ese zoom la
 * pantalla muestra más que la ciudad.
 */
type Caja = typeof manifiesto.caja;
const CAJAS_POR_ZOOM: Record<string, Caja> = manifiesto.cajaPorZoom;

/** Zoom de Google/Apple Maps a partir de lo que entra en la pantalla (teselas base de 256 dp). */
function zoomDeRegion(region: Region, anchoDp: number) {
  return Math.log2((360 * anchoDp) / (256 * region.longitudeDelta));
}

/** Si parte de la región visible no tiene teselas, la región corrida para que entre; si no, `null`. */
function regionDentroDeLasTeselas(region: Region, anchoDp: number): Region | null {
  if (!(region.longitudeDelta > 0) || !(region.latitudeDelta > 0)) return null;
  // Con zoom fraccionario el proveedor puede pedir las teselas del zoom siguiente: se usa su caja,
  // que es igual o más chica, para no quedar nunca cortos.
  const zoom = Math.min(
    manifiesto.zoomMax,
    Math.max(manifiesto.zoomMin, Math.ceil(zoomDeRegion(region, anchoDp))),
  );
  const caja = CAJAS_POR_ZOOM[String(zoom)] ?? manifiesto.caja;
  const latitude = acotar(
    region.latitude,
    caja.sur + region.latitudeDelta / 2,
    caja.norte - region.latitudeDelta / 2,
  );
  const longitude = acotar(
    region.longitude,
    caja.oeste + region.longitudeDelta / 2,
    caja.este - region.longitudeDelta / 2,
  );
  if (latitude === region.latitude && longitude === region.longitude) return null;
  return { ...region, latitude, longitude };
}

/** Entre `minimo` y `maximo`; si la pantalla es más grande que la caja, al medio. */
function acotar(valor: number, minimo: number, maximo: number) {
  if (minimo > maximo) return (minimo + maximo) / 2;
  return Math.min(maximo, Math.max(minimo, valor));
}

export const MapaBase = forwardRef<MapView, MapViewProps>(function MapaBase(
  { children, onRegionChangeComplete, style, ...props },
  ref,
) {
  const esquema = useColorScheme();
  const oscuro = esquema === 'dark';
  const tema = oscuro ? 'oscuro' : 'claro';
  const teselas = useTeselasLocales(tema);
  const mapa = useRef<MapView>(null);
  useImperativeHandle(ref, () => mapa.current as MapView);
  const anchoDp = useRef(Dimensions.get('window').width);

  return (
    <View
      className="flex-1"
      onLayout={(e) => (anchoDp.current = e.nativeEvent.layout.width || anchoDp.current)}>
      <MapView
        ref={mapa}
        style={[{ flex: 1, backgroundColor: manifiesto.fondo[tema] }, style]}
        initialRegion={REGION_CIUDAD}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        minZoomLevel={manifiesto.zoomMin}
        maxZoomLevel={manifiesto.zoomMax}
        userInterfaceStyle={oscuro ? 'dark' : 'light'}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        moveOnMarkerPress={false}
        onRegionChangeComplete={(region, detalles) => {
          const corregida = regionDentroDeLasTeselas(region, anchoDp.current);
          if (corregida) mapa.current?.animateToRegion(corregida, 250);
          onRegionChangeComplete?.(corregida ?? region, detalles);
        }}
        {...props}>
        {teselas && (
          <LocalTile
            // La clave fuerza a rearmar la capa al cambiar de tema: el proveedor cachea las teselas.
            key={teselas}
            pathTemplate={teselas}
            tileSize={manifiesto.tamanioTesela}
          />
        )}
        {children}
      </MapView>
      {teselas && (
        <View
          className="absolute bottom-1 left-1 rounded-md bg-superficie/80 px-2 py-0.5"
          pointerEvents="none">
          <Texto variante="rotulo" color="texto-secundario">
            © OpenStreetMap
          </Texto>
        </View>
      )}
    </View>
  );
});
