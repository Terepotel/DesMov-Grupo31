import { View } from 'react-native';

import type { EstadoReporte as Estado } from '@/tipos';

import { Icono, type NombreIcono } from './icono';
import { Texto, type ColorTexto } from './texto';

/**
 * «Sin enviar» y «Fuera de la ciudad» no son estados de la API: son reportes que siguen en la cola
 * del teléfono. El segundo es el que el servidor no recibió porque el punto (o la calle escrita) no
 * está en la ciudad; no es el «Rechazado» de un operador (P11).
 */
export type EstadoVisible = Estado | 'sin_enviar' | 'fuera_de_la_ciudad';

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
  // Borde lleno: ya no espera nada. Sin el rojo de «Rechazado», que es la decisión de un operador.
  fuera_de_la_ciudad: {
    texto: 'Fuera de la ciudad',
    icono: 'location-outline',
    color: 'texto',
    claseIcono: 'text-texto',
    fondo: 'border-2 border-borde-control bg-superficie-alt',
  },
};

/**
 * El orden en que se listan los estados (filtros, resúmenes): los de la cola primero, porque es lo
 * único que el vecino puede tener que mirar, y después en el orden en que avanza un reporte.
 */
export const ORDEN_ESTADOS_VISIBLES: EstadoVisible[] = [
  'sin_enviar',
  'fuera_de_la_ciudad',
  'recibido',
  'en_revision',
  'asignado',
  'resuelto',
  'rechazado',
];

/** `rechazo` sólo lo traen los de la cola (`ReporteDeLaCola`). */
export function estadoVisible(reporte: {
  estado: Estado;
  sincronizado: boolean;
  rechazo?: { fueraDeLaCiudad: boolean } | null;
}): EstadoVisible {
  if (reporte.sincronizado) return reporte.estado;
  return reporte.rechazo?.fueraDeLaCiudad ? 'fuera_de_la_ciudad' : 'sin_enviar';
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
