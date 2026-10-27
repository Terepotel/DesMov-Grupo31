import type { Region } from 'react-native-maps';

import type { Coordenadas } from '@/tipos';

/** Centro de Gualeguaychú (plaza San Martín). Donde arranca el mapa si no hay otra posición. */
export const CENTRO_CIUDAD: Coordenadas = { latitud: -33.0093, longitud: -58.5172 };

/** La planta urbana entera, para el mapa de la ciudad. */
export const REGION_CIUDAD: Region = {
  latitude: CENTRO_CIUDAD.latitud,
  longitude: CENTRO_CIUDAD.longitud,
  latitudeDelta: 0.07,
  longitudeDelta: 0.07,
};

/** Unas cuadras alrededor de un punto, para elegir o corregir la ubicación de un reporte. */
export const DELTA_CUADRAS = 0.006;

export function regionAlrededorDe(coordenadas: Coordenadas, delta = DELTA_CUADRAS): Region {
  return {
    latitude: coordenadas.latitud,
    longitude: coordenadas.longitud,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/** Los cuatro lados de lo que se ve en el mapa, como los pide `GET /reportes`. */
export interface Caja {
  norte: number;
  sur: number;
  este: number;
  oeste: number;
}

export function cajaDesdeRegion(region: Region): Caja {
  return {
    norte: region.latitude + region.latitudeDelta / 2,
    sur: region.latitude - region.latitudeDelta / 2,
    este: region.longitude + region.longitudeDelta / 2,
    oeste: region.longitude - region.longitudeDelta / 2,
  };
}

export function estaEnCaja({ latitud, longitud }: Coordenadas, caja: Caja) {
  return (
    latitud <= caja.norte && latitud >= caja.sur && longitud <= caja.este && longitud >= caja.oeste
  );
}

const RADIO_TIERRA_M = 6_371_000;

/** Distancia por haversine, en metros: la misma cuenta que hace la API (DECISIONS P14). */
export function distanciaEnMetros(a: Coordenadas, b: Coordenadas) {
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLng = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** «a 12 m de vos», «a 350 m de vos», «a 1,2 km de vos». */
export function describirDistancia(metros: number) {
  if (metros < 1000) return `a ${Math.round(metros)} m de vos`;
  return `a ${(metros / 1000).toFixed(1).replace('.', ',')} km de vos`;
}
