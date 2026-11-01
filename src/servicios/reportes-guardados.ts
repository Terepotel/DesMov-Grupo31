// Los reportes públicos que ya llegaron alguna vez, guardados en el teléfono: sin señal, el mapa y
// la búsqueda de cercanos al hacer un reporte responden con lo último que se vio (R1.7, NF1, P3).
// Lo que el teléfono nunca recibió no aparece hasta que vuelva la conexión.

import Storage from 'expo-sqlite/kv-store';

import type { Coordenadas, Reporte, RespuestaLista } from '@/tipos';
import { distanciaEnMetros, estaEnCaja } from '@/utilidades/geo';

import { ERROR_RED, ErrorApi, TIEMPO_AGOTADO } from './api';
import { hayConexion } from './red';
import type { FiltrosDeReportes } from './reportes';

const CLAVE = 'reportes:publicos';

let enMemoria: Map<string, Reporte> | null = null;

/** `null` si nunca se guardó nada: no es lo mismo que no tener reportes en esa parte del mapa. */
function leer(): Map<string, Reporte> | null {
  if (enMemoria) return enMemoria;
  try {
    const guardados = Storage.getItemSync(CLAVE);
    if (!guardados) return null;
    enMemoria = new Map((JSON.parse(guardados) as Reporte[]).map((r) => [r.id, r]));
    return enMemoria;
  } catch {
    return null;
  }
}

/** Con `sinDuplicados`, los marcados como duplicado no entran: así responde `/reportes/cercanos`. */
export type FiltrosGuardados = FiltrosDeReportes & { sinDuplicados?: boolean };

export function cumpleFiltros(reporte: Reporte, filtros: FiltrosGuardados) {
  const { tipoId, zonaId, estados, caja, cerca, sinDuplicados } = filtros;
  return (
    (tipoId === undefined || reporte.tipoId === tipoId) &&
    (zonaId === undefined || reporte.zonaId === zonaId) &&
    (estados ? estados.includes(reporte.estado) : reporte.estado !== 'rechazado') &&
    (caja === undefined || estaEnCaja(reporte.coordenadas, caja)) &&
    (cerca === undefined ||
      distanciaEnMetros(cerca.coordenadas, reporte.coordenadas) <= cerca.radioMetros) &&
    (!sinDuplicados || reporte.duplicadoDe === null)
  );
}

/** Con radio, del más cercano al más lejano (DECISIONS P12); si no, el más nuevo primero. */
export function ordenarReportes(reportes: Reporte[], cerca?: { coordenadas: Coordenadas }) {
  return [...reportes].sort((a, b) =>
    cerca
      ? distanciaEnMetros(cerca.coordenadas, a.coordenadas) -
        distanciaEnMetros(cerca.coordenadas, b.coordenadas)
      : b.creadoEn.localeCompare(a.creadoEn),
  );
}

function leerReportes(filtros: FiltrosGuardados): RespuestaLista<Reporte> | null {
  const guardados = leer();
  if (!guardados) return null;
  const filtrados = ordenarReportes(
    [...guardados.values()].filter((r) => cumpleFiltros(r, filtros)),
    filtros.cerca,
  );
  const porPagina = filtros.porPagina ?? filtrados.length;
  return {
    datos: filtrados.slice(0, porPagina),
    meta: { total: filtrados.length, pagina: 1, porPagina },
  };
}

/**
 * Suma lo que llegó. Si la respuesta trae todo lo que entra en el filtro, lo guardado que ya no
 * aparece se borra: cambió de estado, lo marcaron como duplicado o ya no existe.
 */
function guardarReportes(filtros: FiltrosGuardados, respuesta: RespuestaLista<Reporte>) {
  const guardados = new Map(leer() ?? []);
  const completa = (filtros.pagina ?? 1) === 1 && respuesta.datos.length >= respuesta.meta.total;
  if (completa) {
    for (const [id, reporte] of guardados) {
      if (cumpleFiltros(reporte, filtros)) guardados.delete(id);
    }
  }
  for (const reporte of respuesta.datos) guardados.set(reporte.id, reporte);
  enMemoria = guardados;
  try {
    Storage.setItemSync(CLAVE, JSON.stringify([...guardados.values()]));
  } catch {
    // Queda en memoria; se guarda en el próximo pedido.
  }
}

export const esFallaDeRed = (error: unknown) =>
  error instanceof ErrorApi && (error.codigo === ERROR_RED || error.codigo === TIEMPO_AGOTADO);

/**
 * Pide a la API y guarda lo que llega. Sin conexión, o si la API no contesta, responde con lo
 * guardado; si nunca se guardó nada, falla como cualquier pedido.
 */
export async function conLosGuardados(
  filtros: FiltrosGuardados,
  pedido: () => Promise<RespuestaLista<Reporte>>,
): Promise<RespuestaLista<Reporte>> {
  const guardados = leerReportes(filtros);
  if (guardados && !(await hayConexion())) return guardados;
  try {
    const respuesta = await pedido();
    guardarReportes(filtros, respuesta);
    return respuesta;
  } catch (error) {
    if (guardados && esFallaDeRed(error)) return guardados;
    throw error;
  }
}

/** Para abrir sin señal el detalle de uno que se vio en el mapa. */
export function reporteGuardado(id: string): Reporte | null {
  return leer()?.get(id) ?? null;
}

/** Una respuesta con todos los de la ciudad (sin rechazados), para dejarla guardada entera. */
export function guardarTodaLaCiudad(reportes: Reporte[]) {
  guardarReportes(
    {},
    { datos: reportes, meta: { total: reportes.length, pagina: 1, porPagina: reportes.length } },
  );
}
