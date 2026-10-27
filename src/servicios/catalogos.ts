import { cuadrillasMock, tiposDeReporteMock, zonasMock } from '@/mocks';
import type { Cuadrilla, RespuestaLista, TipoDeReporte, Zona } from '@/tipos';

import { pedir, USAR_MOCKS } from './api';
import { responderLista } from './mock';

export function obtenerTiposDeReporte(): Promise<RespuestaLista<TipoDeReporte>> {
  if (USAR_MOCKS) return responderLista(tiposDeReporteMock);
  return pedir('/tipos-de-reporte');
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
