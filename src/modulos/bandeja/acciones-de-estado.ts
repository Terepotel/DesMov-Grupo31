import type { NombreIcono } from '@/componentes/ui/icono';
import { DESTINOS_POR_ESTADO } from '@/servicios/reportes';
import type { EstadoReporte, Reporte } from '@/tipos';

export type AccionDeEstado = {
  estado: EstadoReporte;
  /** Verbo + objeto: lo que se elige en la hoja. */
  texto: string;
  icono: NombreIcono;
};

/**
 * Los cambios de estado que el operador puede hacer desde este reporte con `PATCH /estado` (R4.2),
 * en el orden en que se ofrecen: primero el que avanza, al final el rechazo. Asignar una cuadrilla
 * (R4.3) va por otro camino y no está acá.
 */
export function accionesDeEstado(reporte: Reporte): AccionDeEstado[] {
  if (!reporte.sincronizado) return [];
  const destinos = DESTINOS_POR_ESTADO[reporte.estado];
  const acciones: AccionDeEstado[] = [];
  if (destinos.includes('resuelto')) {
    acciones.push({
      estado: 'resuelto',
      texto: 'Marcar como resuelto',
      icono: 'checkmark-circle-outline',
    });
  }
  if (destinos.includes('en_revision')) {
    const vuelve = reporte.estado === 'asignado';
    acciones.push({
      estado: 'en_revision',
      texto: vuelve ? 'Volver a revisión' : 'Pasar a revisión',
      icono: vuelve ? 'arrow-undo-outline' : 'search-outline',
    });
  }
  if (destinos.includes('rechazado')) {
    acciones.push({
      estado: 'rechazado',
      texto: 'Rechazar el reporte',
      icono: 'close-circle-outline',
    });
  }
  return acciones;
}

/** «El reporte pasó a En revisión.», «El reporte quedó rechazado.» */
export function describirCambio(estado: EstadoReporte) {
  switch (estado) {
    case 'en_revision':
      return 'El reporte pasó a En revisión.';
    case 'resuelto':
      return 'El reporte quedó resuelto. El vecino va a verlo así.';
    case 'rechazado':
      return 'El reporte quedó rechazado. El vecino va a leer el motivo.';
    case 'asignado':
      return 'El reporte quedó asignado a la cuadrilla.';
    case 'recibido':
      return 'El reporte volvió a Recibido.';
  }
}
