// El borrador del reporte (R1.10): uno solo, el que el vecino dejó a medio hacer al salir de «Nuevo
// reporte». No es la cola (R1.7): ahí van los que ya se enviaron y esperan señal (consignas §8.1).
// Va en expo-sqlite/kv-store; las fotos y la nota ya están en `<documentos>/`, así que sólo se
// guardan sus rutas. Es de cada usuario: si en el teléfono entra otro, no ve el de nadie.

import Storage from 'expo-sqlite/kv-store';

import { existeArchivoLocal } from '@/servicios/archivos-locales';
import type { NotaGrabada } from '@/servicios/notas-de-voz';

import type { FotoDelReporte } from './fotos-del-reporte';
import type { UbicacionGuardada } from './ubicacion-del-reporte';

export interface Borrador {
  /** El mismo `rep-…` de siempre: si se envía, el reintento no lo duplica. */
  id: string;
  tipoId: string | null;
  descripcion: string;
  nota: NotaGrabada | null;
  fotos: FotoDelReporte[];
  ubicacion: UbicacionGuardada;
  /** Cuándo se tocó por última vez, para decirle al vecino de cuándo es. */
  actualizadoEn: string;
}

const VERSION = 1;

function clave(usuarioId: string) {
  return `borrador-reporte:${usuarioId}`;
}

/**
 * Hay borrador si el vecino puso algo: tipo, foto, texto, nota o el lugar a mano. El punto del GPS
 * solo no cuenta: sale solo al abrir.
 */
export function tieneContenido(b: Omit<Borrador, 'id' | 'actualizadoEn'>) {
  return (
    b.tipoId !== null ||
    b.fotos.length > 0 ||
    b.descripcion.trim() !== '' ||
    b.nota !== null ||
    b.ubicacion.origen === 'manual' ||
    (b.ubicacion.direccionEscrita ?? '').trim() !== ''
  );
}

/**
 * Sincrónico, para que el formulario arranque ya con lo que había (es un JSON chico). Lo que no se
 * puede leer o que ya no está en el teléfono se deja afuera; nunca lanza.
 */
export function leerBorrador(usuarioId: string): Borrador | null {
  try {
    const texto = Storage.getItemSync(clave(usuarioId));
    if (texto === null) return null;
    const guardado = JSON.parse(texto) as { version: number; borrador: Borrador };
    if (guardado.version !== VERSION) return null;
    const { borrador } = guardado;
    const nota = borrador.nota && existeArchivoLocal(borrador.nota.uri) ? borrador.nota : null;
    const fotos = borrador.fotos.filter((foto) => existeArchivoLocal(foto.uri));
    const limpio = { ...borrador, nota, fotos };
    return tieneContenido(limpio) ? limpio : null;
  } catch {
    return null;
  }
}

/** Si no se puede guardar, el formulario sigue igual: sólo no se retoma al volver. */
export async function guardarBorrador(usuarioId: string, borrador: Borrador) {
  try {
    await Storage.setItem(clave(usuarioId), JSON.stringify({ version: VERSION, borrador }));
  } catch {
    // Sin borrador no se pierde nada de lo que está en pantalla.
  }
}

/** Al enviar, al sumarse a otro o al descartar. Los archivos los borra cada store. */
export async function borrarBorrador(usuarioId: string) {
  try {
    await Storage.removeItem(clave(usuarioId));
  } catch {
    // Si queda, al volver se filtran las fotos y la nota que ya no están.
  }
}
