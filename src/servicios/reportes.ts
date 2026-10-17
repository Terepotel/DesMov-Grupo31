import { cambiosDeEstadoMock, errorDeRedMock, listaVaciaMock, reportesMock } from '../mocks'
import type { CambioDeEstado, Reporte, RespuestaApi, RespuestaExitosa } from '../tipos'

export type EscenarioMock = 'normal' | 'vacio' | 'errorRed'

function respuesta<T>(datos: T[]): RespuestaExitosa<T> {
  return {
    datos: JSON.parse(JSON.stringify(datos)) as T[],
    meta: { total: datos.length, pagina: 1, porPagina: 20 },
  }
}

export async function obtenerReportes(
  escenario: EscenarioMock = 'normal'
): Promise<RespuestaApi<Reporte>> {
  if (escenario === 'errorRed') return { error: { ...errorDeRedMock.error } }
  if (escenario === 'vacio') return { datos: [], meta: { ...listaVaciaMock.meta } }
  return respuesta([...reportesMock].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)))
}

export async function obtenerReporte(id: string): Promise<RespuestaExitosa<Reporte>> {
  return respuesta(reportesMock.filter((reporte) => reporte.id === id))
}

export async function obtenerReportesDeUsuario(
  autorId: string
): Promise<RespuestaExitosa<Reporte>> {
  return respuesta(
    reportesMock
      .filter((reporte) => reporte.autorId === autorId)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  )
}

export async function obtenerCambiosDeEstado(
  reporteId: string
): Promise<RespuestaExitosa<CambioDeEstado>> {
  return respuesta(
    cambiosDeEstadoMock
      .filter((cambio) => cambio.reporteId === reporteId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  )
}
