// La foto del problema que se va a reportar. Vive fuera de la pantalla por lo mismo que la
// ubicación: «Sacar la foto» es otra ruta y Expo Router no devuelve valores al volver. La cámara
// escribe acá y el formulario lo lee con `useFotoDelReporte`. Cuando exista el borrador (R1.10),
// este estado pasa a ser parte de él.

import { useSyncExternalStore } from 'react';

import { borrarFoto, type FotoElegida } from '@/servicios/fotos';
import { nuevoId } from '@/utilidades/reportes';

/** Con el id que va a `POST /reportes`: el mismo en cada reintento del envío. */
export type FotoDelReporte = FotoElegida & { id: string };

let actual: FotoDelReporte | null = null;
const oyentes = new Set<() => void>();

function emitir(foto: FotoDelReporte | null) {
  actual = foto;
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useFotoDelReporte() {
  return useSyncExternalStore(suscribir, () => actual);
}

/** La foto nueva reemplaza a la anterior, que se borra del teléfono. */
export function ponerFotoDelReporte(foto: FotoElegida) {
  if (actual) borrarFoto(actual);
  emitir({ ...foto, id: nuevoId('fot') });
}

/** Al empezar un reporte nuevo, al descartarlo o después de enviarlo (la foto ya está en la API). */
export function limpiarFotoDelReporte() {
  if (actual) borrarFoto(actual);
  emitir(null);
}
