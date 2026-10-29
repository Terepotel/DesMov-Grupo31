// La foto del arreglo que el operador acaba de sacar con «Sacar la foto» y todavía no se subió.
// Vive fuera de la pantalla por lo mismo que las fotos del nuevo reporte: la cámara es otra ruta y
// Expo Router no devuelve valores al volver. El detalle la toma y la sube apenas vuelve.

import { useSyncExternalStore } from 'react';

import type { FotoElegida } from '@/servicios/fotos';

let actual: FotoElegida | null = null;
const oyentes = new Set<() => void>();

function emitir(foto: FotoElegida | null) {
  actual = foto;
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useFotoDelArregloPendiente() {
  return useSyncExternalStore(suscribir, () => actual);
}

/** La cámara la deja acá al volver al detalle. */
export function entregarFotoDelArreglo(foto: FotoElegida) {
  emitir(foto);
}

/** El detalle la retira para subirla: devuelve la foto y vacía el lugar. */
export function retirarFotoDelArreglo(): FotoElegida | null {
  const foto = actual;
  emitir(null);
  return foto;
}
