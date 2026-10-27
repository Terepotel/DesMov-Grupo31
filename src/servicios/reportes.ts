// Única puerta de lectura y escritura de reportes (PDF, pág. 5).

import { cambiosDeEstadoMock, reportesMock } from '@/mocks';
import type { CambioDeEstado, EstadoReporte, Reporte, RespuestaLista, RespuestaUno } from '@/tipos';

import { ErrorApi, pedir, USAR_MOCKS } from './api';
import { responderLista, responderUno, usuarioIdDeLaSesionMock } from './mock';

export interface FiltrosDeReportes {
  tipoId?: string;
  zonaId?: string;
  /** Sin estados, la API no trae los rechazados. */
  estados?: EstadoReporte[];
  pagina?: number;
  porPagina?: number;
}

const masNuevoPrimero = (a: Reporte, b: Reporte) => b.creadoEn.localeCompare(a.creadoEn);

/** Los reportes públicos de la ciudad (el mapa). */
export function obtenerReportes(filtros: FiltrosDeReportes = {}): Promise<RespuestaLista<Reporte>> {
  const { tipoId, zonaId, estados, pagina, porPagina } = filtros;

  if (USAR_MOCKS) {
    const filtrados = reportesMock.filter(
      (r) =>
        (tipoId === undefined || r.tipoId === tipoId) &&
        (zonaId === undefined || r.zonaId === zonaId) &&
        (estados ? estados.includes(r.estado) : r.estado !== 'rechazado'),
    );
    return responderLista([...filtrados].sort(masNuevoPrimero), { pagina, porPagina });
  }

  return pedir('/reportes', {
    consulta: { tipoId, zonaId, estado: estados?.join(','), pagina, porPagina },
  });
}

export async function obtenerReporte(id: string): Promise<Reporte> {
  if (USAR_MOCKS) {
    return responderUno(
      reportesMock.find((r) => r.id === id),
      new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404),
    );
  }
  return (await pedir<RespuestaUno<Reporte>>(`/reportes/${encodeURIComponent(id)}`)).datos;
}

/** Los reportes del usuario de la sesión, del más nuevo al más viejo. */
export function obtenerMisReportes(
  paginado: { pagina?: number; porPagina?: number } = {},
): Promise<RespuestaLista<Reporte>> {
  if (USAR_MOCKS) {
    const autorId = usuarioIdDeLaSesionMock();
    const propios = reportesMock.filter((r) => r.autorId === autorId);
    return responderLista([...propios].sort(masNuevoPrimero), paginado);
  }
  return pedir('/yo/reportes', { consulta: paginado });
}

/** «Qué fue pasando»: los cambios de estado, del más viejo al más nuevo. */
export function obtenerCambiosDeEstado(reporteId: string): Promise<RespuestaLista<CambioDeEstado>> {
  if (USAR_MOCKS) {
    const cambios = cambiosDeEstadoMock
      .filter((c) => c.reporteId === reporteId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    return responderLista(cambios);
  }
  return pedir(`/reportes/${encodeURIComponent(reporteId)}/cambios`);
}
