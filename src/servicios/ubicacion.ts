// Dónde está el vecino (expo-location). Nunca lanza: devuelve un resultado con `estado` para que
// la pantalla diga qué pasó y qué hacer (NF4: sin permiso igual se puede reportar a mano).

import * as Location from 'expo-location';

import type { Coordenadas } from '@/tipos';

export type ResultadoUbicacion =
  | { estado: 'ok'; coordenadas: Coordenadas; precisionMetros: number | null }
  /** El vecino no dio permiso (o lo negó para siempre). */
  | { estado: 'sin_permiso' }
  /** Hay permiso pero el GPS está apagado o no respondió a tiempo. */
  | { estado: 'no_disponible' };

function aCoordenadas(posicion: Location.LocationObject): Coordenadas {
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude };
}

/** Pide el permiso si hace falta y devuelve la posición actual. */
export async function obtenerUbicacion(): Promise<ResultadoUbicacion> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return { estado: 'sin_permiso' };

    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      estado: 'ok',
      coordenadas: aCoordenadas(posicion),
      precisionMetros: posicion.coords.accuracy ?? null,
    };
  } catch {
    return { estado: 'no_disponible' };
  }
}

/** La última posición que guardó el teléfono, sin encender el GPS. `null` si no hay o no hay permiso. */
export async function obtenerUltimaUbicacionConocida(): Promise<Coordenadas | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted) return null;
    const posicion = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
    return posicion ? aCoordenadas(posicion) : null;
  } catch {
    return null;
  }
}

/** «Rocamora 1240» a partir de un punto. Necesita red: sin señal devuelve `null` (consignas §8.1 P3). */
export async function direccionDesdeCoordenadas(coordenadas: Coordenadas): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({
      latitude: coordenadas.latitud,
      longitude: coordenadas.longitud,
    });
    if (!lugar) return null;
    if (lugar.street) {
      return lugar.streetNumber ? `${lugar.street} ${lugar.streetNumber}` : lugar.street;
    }
    return lugar.name ?? lugar.formattedAddress ?? null;
  } catch {
    return null;
  }
}

/** Un punto a partir de «Rocamora 1240». Busca dentro de la ciudad. `null` si no se encuentra o no hay señal. */
export async function coordenadasDesdeDireccion(direccion: string): Promise<Coordenadas | null> {
  const texto = direccion.trim();
  if (!texto) return null;
  try {
    const [lugar] = await Location.geocodeAsync(`${texto}, Gualeguaychú, Entre Ríos, Argentina`);
    return lugar ? { latitud: lugar.latitude, longitud: lugar.longitude } : null;
  } catch {
    return null;
  }
}
