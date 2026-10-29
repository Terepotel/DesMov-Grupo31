// Las fotos del problema que se va a reportar: la obligatoria y una segunda opcional (R1.3, P16).
// Viven fuera de la pantalla por lo mismo que la ubicación: «Sacar la foto» es otra ruta y Expo
// Router no devuelve valores al volver. Se guardan con el borrador (R1.10): los archivos ya están en
// `<documentos>/fotos/`, así que sólo se guarda la lista.

import { useSyncExternalStore } from 'react';

import { borrarFoto, MAX_FOTOS_DEL_PROBLEMA, type FotoElegida } from '@/servicios/fotos';
import { nuevoId } from '@/utilidades/reportes';

/** Con el id que va a `POST /reportes`: el mismo en cada reintento del envío. */
export type FotoDelReporte = FotoElegida & { id: string };

let actual: FotoDelReporte[] = [];
const oyentes = new Set<() => void>();

function emitir(fotos: FotoDelReporte[]) {
  actual = fotos;
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useFotosDelReporte() {
  return useSyncExternalStore(suscribir, () => actual);
}

/**
 * Pone la foto en `lugar` (0 la primera, 1 la segunda). Si ya había una ahí, se reemplaza y se
 * borra del teléfono. Un lugar más allá de las que hay agrega al final.
 */
export function ponerFotoDelReporte(lugar: number, foto: FotoElegida) {
  if (lugar >= MAX_FOTOS_DEL_PROBLEMA) return;
  const fotos = [...actual];
  const anterior = fotos[lugar];
  if (anterior) borrarFoto(anterior);
  fotos[Math.min(lugar, fotos.length)] = { ...foto, id: nuevoId('fot') };
  emitir(fotos);
}

export function quitarFotoDelReporte(id: string) {
  const foto = actual.find((f) => f.id === id);
  if (!foto) return;
  borrarFoto(foto);
  emitir(actual.filter((f) => f.id !== id));
}

/** Al retomar el borrador (R1.10). No borra nada: son las mismas fotos. */
export function restaurarFotosDelReporte(fotos: FotoDelReporte[]) {
  emitir(fotos.slice(0, MAX_FOTOS_DEL_PROBLEMA));
}

/** Al empezar un reporte nuevo, al descartarlo o después de enviarlo (ya están en la API). */
export function limpiarFotosDelReporte() {
  actual.forEach(borrarFoto);
  emitir([]);
}
