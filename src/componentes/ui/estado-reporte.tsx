import { View } from 'react-native';

import type { EstadoReporte as Estado } from '@/tipos';

import { Icono, type NombreIcono } from './icono';
import { Texto, type ColorTexto } from './texto';

/** «Sin enviar» no es un estado de la API: es el reporte que sigue en la cola del teléfono. */
export type EstadoVisible = Estado | 'sin_enviar';

export const estadosReporte: Record<
  EstadoVisible,
  { texto: string; icono: NombreIcono; color: ColorTexto; claseIcono: string; fondo: string }
> = {
  recibido: {
    texto: 'Recibido',
    icono: 'time-outline',
    color: 'estado-recibido',
    claseIcono: 'text-estado-recibido',
    fondo: 'bg-estado-recibido-fondo',
  },
  en_revision: {
    texto: 'En revisión',
    icono: 'search-outline',
    color: 'estado-revision',
    claseIcono: 'text-estado-revision',
    fondo: 'bg-estado-revision-fondo',
  },
  asignado: {
    texto: 'Asignado a cuadrilla',
    icono: 'people-outline',
    color: 'estado-asignado',
    claseIcono: 'text-estado-asignado',
    fondo: 'bg-estado-asignado-fondo',
  },
  resuelto: {
    texto: 'Resuelto',
    icono: 'checkmark-circle',
    color: 'estado-resuelto',
    claseIcono: 'text-estado-resuelto',
    fondo: 'bg-estado-resuelto-fondo',
  },
  rechazado: {
    texto: 'Rechazado',
    icono: 'close-circle-outline',
    color: 'estado-rechazado',
    claseIcono: 'text-estado-rechazado',
    fondo: 'bg-estado-rechazado-fondo',
  },
  // El borde punteado dice «todavía no llegó».
  sin_enviar: {
    texto: 'Sin enviar',
    icono: 'cloud-offline-outline',
    color: 'texto-secundario',
    claseIcono: 'text-texto-secundario',
    fondo: 'border-2 border-dashed border-borde-control',
  },
};

/**
 * El orden en que se listan los estados (filtros, resúmenes): «Sin enviar» primero, porque es lo
 * único que el vecino puede tener que mirar, y después en el orden en que avanza un reporte.
 */
export const ORDEN_ESTADOS_VISIBLES: EstadoVisible[] = [
  'sin_enviar',
  'recibido',
  'en_revision',
  'asignado',
  'resuelto',
  'rechazado',
];

export function estadoVisible(reporte: { estado: Estado; sincronizado: boolean }): EstadoVisible {
  return reporte.sincronizado ? reporte.estado : 'sin_enviar';
}

/** Insignia del estado de un reporte: siempre palabra e ícono, nunca sólo el color. */
export function EstadoReporte({ estado }: { estado: EstadoVisible }) {
  const estilo = estadosReporte[estado];

  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-3 py-1 ${estilo.fondo}`}>
      <Icono nombre={estilo.icono} tamano={20} className={estilo.claseIcono} />
      <Texto variante="insignia" color={estilo.color} className="shrink">
        {estilo.texto}
      </Texto>
    </View>
  );
}
