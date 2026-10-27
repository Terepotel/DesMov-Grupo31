// Única puerta de lectura y escritura de reportes (PDF, pág. 5).

import { cambiosDeEstadoMock, reportesMock, usuariosMock } from '@/mocks';
import type {
  CambioDeEstado,
  Coordenadas,
  EstadoReporte,
  Reporte,
  RespuestaLista,
  RespuestaUno,
} from '@/tipos';
import { distanciaEnMetros, estaEnCaja, type Caja } from '@/utilidades/geo';

import { ErrorApi, pedir, USAR_MOCKS } from './api';
import { responderLista, responderUno, usuarioIdDeLaSesionMock } from './mock';

export interface FiltrosDeReportes {
  tipoId?: string;
  zonaId?: string;
  /** Sin estados, la API no trae los rechazados. */
  estados?: EstadoReporte[];
  /** Sólo lo que se ve en el mapa. */
  caja?: Caja;
  /** Alrededor de un punto; `radioMetros` de 1 a 50 000. Se puede combinar con `caja`. */
  cerca?: { coordenadas: Coordenadas; radioMetros: number };
  pagina?: number;
  porPagina?: number;
}

const masNuevoPrimero = (a: Reporte, b: Reporte) => b.creadoEn.localeCompare(a.creadoEn);

/** Los reportes públicos de la ciudad (el mapa). */
export function obtenerReportes(filtros: FiltrosDeReportes = {}): Promise<RespuestaLista<Reporte>> {
  const { tipoId, zonaId, estados, caja, cerca, pagina, porPagina } = filtros;

  if (USAR_MOCKS) {
    const filtrados = reportesMock.filter(
      (r) =>
        (tipoId === undefined || r.tipoId === tipoId) &&
        (zonaId === undefined || r.zonaId === zonaId) &&
        (estados ? estados.includes(r.estado) : r.estado !== 'rechazado') &&
        (caja === undefined || estaEnCaja(r.coordenadas, caja)) &&
        (cerca === undefined ||
          distanciaEnMetros(cerca.coordenadas, r.coordenadas) <= cerca.radioMetros),
    );
    // Con radio, la API ordena del más cercano al más lejano (DECISIONS P12).
    const ordenados = cerca
      ? [...filtrados].sort(
          (a, b) =>
            distanciaEnMetros(cerca.coordenadas, a.coordenadas) -
            distanciaEnMetros(cerca.coordenadas, b.coordenadas),
        )
      : [...filtrados].sort(masNuevoPrimero);
    return responderLista(ordenados, { pagina, porPagina });
  }

  return pedir('/reportes', {
    consulta: {
      tipoId,
      zonaId,
      estado: estados?.join(','),
      ...caja,
      latitud: cerca?.coordenadas.latitud,
      longitud: cerca?.coordenadas.longitud,
      radioMetros: cerca?.radioMetros,
      pagina,
      porPagina,
    },
  });
}

const ABIERTOS: EstadoReporte[] = ['recibido', 'en_revision', 'asignado'];

/** Radio con el que la API busca duplicados si no se le pide otro (R3.4). */
export const RADIO_CERCANOS_M = 50;

/**
 * Antes de crear uno: los reportes abiertos a menos de `radioMetros` (50 por defecto, 200 como
 * máximo), del más cercano al más lejano, sin los marcados como duplicado (API R9).
 */
export function obtenerReportesCercanos(
  coordenadas: Coordenadas,
  { tipoId, radioMetros }: { tipoId?: string; radioMetros?: number } = {},
): Promise<RespuestaLista<Reporte>> {
  if (USAR_MOCKS) {
    const radio = radioMetros ?? RADIO_CERCANOS_M;
    const cercanos = reportesMock
      .filter(
        (r) =>
          ABIERTOS.includes(r.estado) &&
          r.duplicadoDe === null &&
          (tipoId === undefined || r.tipoId === tipoId) &&
          distanciaEnMetros(coordenadas, r.coordenadas) <= radio,
      )
      .sort(
        (a, b) =>
          distanciaEnMetros(coordenadas, a.coordenadas) -
          distanciaEnMetros(coordenadas, b.coordenadas),
      );
    return responderLista(cercanos);
  }

  return pedir('/reportes/cercanos', {
    consulta: { latitud: coordenadas.latitud, longitud: coordenadas.longitud, tipoId, radioMetros },
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

export interface FiltrosDeBandeja {
  /** Sin zona, la API usa la del operador; `'todas'` trae todas. */
  zonaId?: string;
  tipoId?: string;
  estados?: EstadoReporte[];
  pagina?: number;
  porPagina?: number;
}

/** Sólo operadores: los reportes abiertos, los más apoyados primero y, a igualdad, el más viejo. */
export function obtenerBandeja(filtros: FiltrosDeBandeja = {}): Promise<RespuestaLista<Reporte>> {
  const { zonaId, tipoId, estados, pagina, porPagina } = filtros;

  if (USAR_MOCKS) {
    const operador = usuariosMock.find((u) => u.id === usuarioIdDeLaSesionMock());
    if (operador?.rol !== 'operador') {
      return Promise.reject(
        new ErrorApi('SIN_PERMISO', 'Esta parte es sólo para operadores.', 403),
      );
    }
    const zona = zonaId ?? operador.zonaId ?? 'todas';
    const abiertos = reportesMock.filter(
      (r) =>
        (estados ?? ABIERTOS).includes(r.estado) &&
        ABIERTOS.includes(r.estado) &&
        (zona === 'todas' || r.zonaId === zona) &&
        (tipoId === undefined || r.tipoId === tipoId),
    );
    const ordenados = [...abiertos].sort(
      (a, b) =>
        b.adhesiones - a.adhesiones ||
        a.creadoEn.localeCompare(b.creadoEn) ||
        a.id.localeCompare(b.id),
    );
    return responderLista(ordenados, { pagina, porPagina });
  }

  return pedir('/bandeja', {
    consulta: { zonaId, tipoId, estado: estados?.join(','), pagina, porPagina },
  });
}
