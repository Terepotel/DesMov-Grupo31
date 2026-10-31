import Storage from 'expo-sqlite/kv-store';

import { cuadrillasMock, tiposDeReporteMock, zonasMock } from '@/mocks';
import type { Cuadrilla, RespuestaLista, TipoDeReporte, Zona } from '@/tipos';

import { pedir, USAR_MOCKS } from './api';
import { hayConexion } from './cola';
import { responderLista } from './mock';

const CLAVE_TIPOS = 'catalogo:tipos-de-reporte';

function leerTiposGuardados(): RespuestaLista<TipoDeReporte> | null {
  try {
    const guardados = Storage.getItemSync(CLAVE_TIPOS);
    return guardados ? (JSON.parse(guardados) as RespuestaLista<TipoDeReporte>) : null;
  } catch {
    return null;
  }
}

/**
 * Sin tipos no se puede elegir qué pasa, y el reporte tiene que poder hacerse sin señal (R1.7, NF1):
 * se guarda la última lista que llegó y se usa cuando no hay conexión o la API no contesta. Si
 * nunca llegó ninguna, falla como cualquier pedido.
 */
export async function obtenerTiposDeReporte(): Promise<RespuestaLista<TipoDeReporte>> {
  if (USAR_MOCKS) return responderLista(tiposDeReporteMock);
  const guardados = leerTiposGuardados();
  if (guardados && !(await hayConexion())) return guardados;
  try {
    const tipos = await pedir<RespuestaLista<TipoDeReporte>>('/tipos-de-reporte');
    try {
      Storage.setItemSync(CLAVE_TIPOS, JSON.stringify(tipos));
    } catch {
      // Se guarda la próxima vez.
    }
    return tipos;
  } catch (error) {
    if (guardados) return guardados;
    throw error;
  }
}

export function obtenerZonas(): Promise<RespuestaLista<Zona>> {
  if (USAR_MOCKS) return responderLista(zonasMock);
  return pedir('/zonas');
}

/** Sólo para operadores: la API responde `SIN_PERMISO` a un vecino. */
export function obtenerCuadrillas(
  filtros: { zonaId?: string; activa?: boolean } = {},
): Promise<RespuestaLista<Cuadrilla>> {
  if (USAR_MOCKS) {
    return responderLista(
      cuadrillasMock.filter(
        (c) =>
          (filtros.zonaId === undefined || c.zonaId === filtros.zonaId) &&
          (filtros.activa === undefined || c.activa === filtros.activa),
      ),
    );
  }
  return pedir('/cuadrillas', {
    consulta: {
      zonaId: filtros.zonaId,
      activa: filtros.activa === undefined ? undefined : String(filtros.activa),
    },
  });
}
