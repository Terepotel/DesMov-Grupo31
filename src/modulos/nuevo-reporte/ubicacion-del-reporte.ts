// Dónde está el problema que se va a reportar. Vive fuera de la pantalla porque «Corregir en el
// mapa» es otra ruta y Expo Router no devuelve valores al volver: la pantalla de corrección escribe
// acá y el formulario lo lee con `useUbicacionDelReporte`. Cuando exista el borrador (R1.10), este
// estado pasa a ser parte de él.

import { useSyncExternalStore } from 'react';

import { direccionDesdeCoordenadas, obtenerUbicacion } from '@/servicios/ubicacion';
import type { Coordenadas } from '@/tipos';

export interface UbicacionDelReporte {
  coordenadas: Coordenadas | null;
  /** «Rocamora 1240». `null` mientras no se pudo calcular (sin señal: consignas §8.1 P3). */
  direccion: string | null;
  /** De dónde salió el punto: del GPS (R1.4) o puesto a mano en el mapa (NF4). */
  origen: 'gps' | 'manual' | null;
  /** Qué pasó al pedir el GPS, para que el formulario diga qué hacer. */
  gps: 'pendiente' | 'buscando' | 'ok' | 'sin_permiso' | 'no_disponible';
  /**
   * Lo que escribió el vecino en el campo de la dirección (P3); `null` si no lo tocó y se muestra la
   * calculada. Sin punto, alcanza para reportar: las coordenadas se buscan al enviar. Con punto, es
   * la dirección que va, antes que la calculada.
   */
  direccionEscrita: string | null;
}

const VACIA: UbicacionDelReporte = {
  coordenadas: null,
  direccion: null,
  origen: null,
  gps: 'pendiente',
  direccionEscrita: null,
};

let actual: UbicacionDelReporte = VACIA;
const oyentes = new Set<() => void>();

function emitir(cambios: Partial<UbicacionDelReporte>) {
  actual = { ...actual, ...cambios };
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useUbicacionDelReporte() {
  return useSyncExternalStore(suscribir, () => actual);
}

/** Al empezar un reporte nuevo (o al descartarlo). */
export function limpiarUbicacionDelReporte() {
  actual = VACIA;
  oyentes.forEach((oyente) => oyente());
}

/**
 * El punto que eligió el vecino en el mapa. Calcula la dirección si hay señal; lo que había escrito
 * se deja de usar, porque el punto nuevo es lo último que eligió.
 */
export async function elegirUbicacionAMano(coordenadas: Coordenadas) {
  emitir({ coordenadas, origen: 'manual', direccion: null, direccionEscrita: null });
  const direccion = await direccionDesdeCoordenadas(coordenadas);
  if (actual.coordenadas === coordenadas) emitir({ direccion });
}

export function escribirDireccion(direccionEscrita: string) {
  emitir({ direccionEscrita });
}

/** R1.4: la ubicación sale sola del GPS. Si falla, queda registrado por qué y el vecino la pone a mano. */
export async function tomarUbicacionDelGps() {
  emitir({ gps: 'buscando' });
  const resultado = await obtenerUbicacion();
  if (resultado.estado !== 'ok') {
    emitir({ gps: resultado.estado });
    return resultado;
  }
  emitir({ gps: 'ok', coordenadas: resultado.coordenadas, origen: 'gps', direccion: null });
  const direccion = await direccionDesdeCoordenadas(resultado.coordenadas);
  if (actual.coordenadas === resultado.coordenadas) emitir({ direccion });
  return resultado;
}
