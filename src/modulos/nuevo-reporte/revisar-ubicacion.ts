// Lo que `validarReporte` no puede ver sin preguntar afuera: si la calle escrita existe y si el
// lugar queda dentro de Gualeguaychú. La API valida lo mismo (FUERA_DE_LA_CIUDAD), pero así se
// avisa junto con lo que falta, antes de enviar (§8.2).

import { obtenerZonas } from '@/servicios/catalogos';
import { coordenadasDesdeDireccion } from '@/servicios/ubicacion';
import type { Coordenadas, Zona } from '@/tipos';
import { estaDentroDe } from '@/utilidades/geo';

export interface UbicacionRevisada {
  /** El punto que va a la API: el del mapa o GPS, o el que salió de la calle escrita. */
  coordenadas: Coordenadas | null;
  error: string | null;
}

// Las zonas cambian muy poco: se piden una vez por sesión.
let zonas: Zona[] | null = null;

async function zonasDeLaCiudad() {
  if (!zonas) {
    try {
      zonas = (await obtenerZonas()).datos;
    } catch {
      return null;
    }
  }
  return zonas;
}

/** `escrita` es lo que escribió el vecino (vacío si no tocó el campo). */
export async function revisarUbicacion(
  coordenadas: Coordenadas | null,
  escrita: string,
): Promise<UbicacionRevisada> {
  const deLaCalle = escrita ? await coordenadasDesdeDireccion(escrita) : null;
  const punto = coordenadas ?? deLaCalle;
  if (!punto) {
    return {
      coordenadas: null,
      error: escrita
        ? `No encontramos «${escrita}». Revisá la calle y la altura, o marcá el lugar en el mapa.`
        : null,
    };
  }

  // Sin las zonas (sin señal) no se puede saber: lo revisa la API al recibirlo.
  const limites = await zonasDeLaCiudad();
  if (!limites) return { coordenadas: punto, error: null };
  const afuera = (c: Coordenadas) => !limites.some((zona) => estaDentroDe(c, zona.limite));

  if (deLaCalle && afuera(deLaCalle)) {
    return {
      coordenadas: punto,
      error: `«${escrita}» queda fuera de Gualeguaychú. Revisá la dirección o marcá el lugar en el mapa.`,
    };
  }
  if (coordenadas && afuera(coordenadas)) {
    return {
      coordenadas: punto,
      error: 'Ese punto queda fuera de Gualeguaychú. Corregilo en el mapa.',
    };
  }
  return { coordenadas: punto, error: null };
}
