import { cuadrillasMock, tiposDeReporteMock, usuariosMock, zonasMock } from '../mocks'
import type { Cuadrilla, RespuestaExitosa, TipoDeReporte, Usuario, Zona } from '../tipos'

async function respuesta<T>(datos: T[]): Promise<RespuestaExitosa<T>> {
  return {
    datos: JSON.parse(JSON.stringify(datos)) as T[],
    meta: { total: datos.length, pagina: 1, porPagina: 20 },
  }
}

export function obtenerTiposDeReporte(): Promise<RespuestaExitosa<TipoDeReporte>> {
  return respuesta(tiposDeReporteMock)
}

export function obtenerZonas(): Promise<RespuestaExitosa<Zona>> {
  return respuesta(zonasMock)
}

export function obtenerCuadrillas(): Promise<RespuestaExitosa<Cuadrilla>> {
  return respuesta(cuadrillasMock)
}

export function obtenerUsuarios(): Promise<RespuestaExitosa<Usuario>> {
  return respuesta(usuariosMock)
}
