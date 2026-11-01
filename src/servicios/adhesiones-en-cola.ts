// Sumarse a un reporte sin señal (R3.5, R1.7): la adhesión queda guardada y se manda sola cuando
// vuelve la conexión, junto con la cola de reportes (`useSincronizarCola`).

import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import type { Reporte } from '@/tipos';

import { ERROR_RED, ErrorApi, TIEMPO_AGOTADO } from './api';
import { hayConexion } from './red';
import { sumarseAReporte } from './reportes';

export type ResultadoDeAdhesion =
  | { tipo: 'sumado'; reporte: Reporte; yaEstaba: boolean }
  /** Sin señal: se manda sola cuando vuelva. */
  | { tipo: 'pendiente' };

/** Lo justo para el aviso del teléfono cuando llegue. */
interface AdhesionPendiente {
  reporteId: string;
  codigo: string;
  direccion: string;
}

const PASAJEROS = new Set([ERROR_RED, TIEMPO_AGOTADO, 'ERROR_INTERNO']);
const clave = (usuarioId: string) => `adhesiones:pendientes:${usuarioId}`;

function leer(usuarioId: string): AdhesionPendiente[] {
  try {
    const guardadas = Storage.getItemSync(clave(usuarioId));
    return guardadas ? (JSON.parse(guardadas) as AdhesionPendiente[]) : [];
  } catch {
    return [];
  }
}

const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function escribir(usuarioId: string, pendientes: AdhesionPendiente[]) {
  Storage.setItemSync(clave(usuarioId), JSON.stringify(pendientes));
  oyentes.forEach((oyente) => oyente());
}

function guardar(usuarioId: string, reporte: Reporte) {
  const pendientes = leer(usuarioId).filter((p) => p.reporteId !== reporte.id);
  escribir(usuarioId, [
    ...pendientes,
    { reporteId: reporte.id, codigo: reporte.codigo, direccion: reporte.direccion },
  ]);
}

function quitar(usuarioId: string, reporteId: string) {
  escribir(
    usuarioId,
    leer(usuarioId).filter((p) => p.reporteId !== reporteId),
  );
}

/** Si no se puede guardar, falla como sin la cola: con el error de red, para probar de nuevo. */
function dejarPendiente(usuarioId: string, reporte: Reporte, error: unknown): ResultadoDeAdhesion {
  try {
    guardar(usuarioId, reporte);
  } catch {
    throw (
      error ??
      new ErrorApi(
        ERROR_RED,
        'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.',
      )
    );
  }
  return { tipo: 'pendiente' };
}

const esPasajero = (error: unknown) => !(error instanceof ErrorApi) || PASAJEROS.has(error.codigo);

/**
 * Con señal se suma en el momento; sin señal, o si la API no contesta, queda pendiente. Si la API
 * dice que no (propio, cerrado…), lanza el error para mostrarlo.
 */
export async function sumarseOGuardar(
  usuarioId: string,
  reporte: Reporte,
): Promise<ResultadoDeAdhesion> {
  if (!(await hayConexion())) return dejarPendiente(usuarioId, reporte, null);
  try {
    const respuesta = await sumarseAReporte(reporte.id);
    return { tipo: 'sumado', ...respuesta };
  } catch (error) {
    if (!esPasajero(error)) throw error;
    return dejarPendiente(usuarioId, reporte, error);
  }
}

/** Para que el detalle no ofrezca de nuevo «Sumarme» a uno que ya espera la señal. */
export function useAdhesionPendiente(usuarioId: string | null, reporteId: string) {
  return useSyncExternalStore(suscribir, () =>
    usuarioId === null ? false : leer(usuarioId).some((p) => p.reporteId === reporteId),
  );
}

/** Avisa cuando una pendiente llega (para el aviso local). */
type OyenteDeAdhesion = (adhesion: AdhesionPendiente) => void;
const oyentesDeAdhesion = new Set<OyenteDeAdhesion>();

export function alSumarseDesdeLaCola(oyente: OyenteDeAdhesion) {
  oyentesDeAdhesion.add(oyente);
  return () => {
    oyentesDeAdhesion.delete(oyente);
  };
}

let sincronizando: Promise<void> | null = null;

/**
 * Manda las pendientes. Si la API dice que ya no se puede (se cerró, era propio, ya no existe), se
 * descarta: no hay nada que reintentar. Corta en la primera falla pasajera. Nunca lanza.
 */
export function sincronizarAdhesiones(usuarioId: string): Promise<void> {
  sincronizando ??= (async () => {
    try {
      if (!(await hayConexion())) return;
      for (const pendiente of leer(usuarioId)) {
        try {
          const { yaEstaba } = await sumarseAReporte(pendiente.reporteId);
          quitar(usuarioId, pendiente.reporteId);
          if (!yaEstaba) oyentesDeAdhesion.forEach((oyente) => oyente(pendiente));
        } catch (error) {
          if (error instanceof ErrorApi && error.codigo === 'NO_AUTENTICADO') break;
          if (esPasajero(error)) break;
          quitar(usuarioId, pendiente.reporteId);
        }
      }
    } catch {
      // Se prueba de nuevo en la próxima.
    } finally {
      sincronizando = null;
    }
  })();
  return sincronizando;
}
