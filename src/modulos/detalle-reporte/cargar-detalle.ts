import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { obtenerCuadrillas, obtenerTiposDeReporte, obtenerZonas } from '@/servicios/catalogos';
import {
  obtenerCambiosDeEstado,
  obtenerReporte,
  obtenerReportePorCodigo,
} from '@/servicios/reportes';
import type { CambioDeEstado, Cuadrilla, Reporte, TipoDeReporte, Zona } from '@/tipos';
import { esCodigoDeSeguimiento } from '@/utilidades/reportes';
import type { Carga } from '@/utilidades/use-carga';

export type CargaCambios = Carga<CambioDeEstado[]>;

export type DetalleReporte = {
  reporte: Reporte;
  /** Los catálogos son `null` si no llegaron: el reporte se muestra igual. */
  tipo: TipoDeReporte | null;
  zona: Zona | null;
  /** Sólo para operadores (a un vecino la API le responde 403). */
  cuadrillas: Cuadrilla[] | null;
  /** Aparte: si fallan, el reporte se muestra igual y sólo esa sección ofrece reintentar. */
  cambios: CargaCambios;
};

export async function cargarCambios(reporteId: string): Promise<CargaCambios> {
  try {
    return { tipo: 'listo', datos: (await obtenerCambiosDeEstado(reporteId)).datos };
  } catch (error) {
    return { tipo: 'error', mensaje: mensajeDeError(error) };
  }
}

function opcional<T>(pedido: Promise<{ datos: T[] }>): Promise<T[] | null> {
  return pedido.then((respuesta) => respuesta.datos).catch(() => null);
}

/** Un parámetro de ruta puede llegar repetido (`?id=a&id=b`) o faltar. */
export type ParametroDeRuta = string | string[] | undefined;

/**
 * `parametro` es el de la ruta: un id (`rep-…`) o un número de seguimiento (`GCHU-…`, el enlace
 * del QR). Con el id, los cambios se piden a la vez que el reporte; con el código, después.
 */
export async function cargarDetalle(
  parametroDeRuta: ParametroDeRuta,
  esOperador: boolean,
): Promise<DetalleReporte> {
  const parametro = (Array.isArray(parametroDeRuta) ? parametroDeRuta[0] : parametroDeRuta)?.trim();
  if (!parametro) {
    throw new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404);
  }
  const porCodigo = esCodigoDeSeguimiento(parametro);
  const cambiosPorId = porCodigo ? null : cargarCambios(parametro);

  const [reporte, tipos, zonas, cuadrillas] = await Promise.all([
    porCodigo ? obtenerReportePorCodigo(parametro) : obtenerReporte(parametro),
    opcional(obtenerTiposDeReporte()),
    opcional(obtenerZonas()),
    esOperador ? opcional(obtenerCuadrillas()) : Promise.resolve(null),
  ]);

  // Uno sin enviar no está en el servidor: no tiene cambios que pedir.
  const cambios: CargaCambios = reporte.sincronizado
    ? await (cambiosPorId ?? cargarCambios(reporte.id))
    : { tipo: 'listo', datos: [] };

  return {
    reporte,
    tipo: tipos?.find((t) => t.id === reporte.tipoId) ?? null,
    zona: zonas?.find((z) => z.id === reporte.zonaId) ?? null,
    cuadrillas,
    cambios,
  };
}
