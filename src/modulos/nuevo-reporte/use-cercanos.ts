import { useEffect, useState } from 'react';

import { obtenerReportesCercanos } from '@/servicios/reportes';
import type { Coordenadas, Reporte } from '@/tipos';

export type Cercanos = {
  /** Qué lugar y tipo se buscó: con otro, la búsqueda vieja ya no vale. */
  para: string;
  reportes: Reporte[];
  desde: Coordenadas;
};

/**
 * R1.8 y R3.4: apenas el reporte tiene un punto (el del GPS o el del mapa), los abiertos a menos de
 * 50 m; del mismo tipo si ya se eligió, si no de todos. Sin señal no hay con qué comparar (todavía
 * no se guardan reportes en el teléfono): no se muestra nada, y si se cuela un duplicado lo marca el
 * operador (P3).
 */
export function useCercanos(coordenadas: Coordenadas | null, tipoId: string | null) {
  const [cercanos, setCercanos] = useState<Cercanos | null>(null);
  const latitud = coordenadas?.latitud;
  const longitud = coordenadas?.longitud;
  const para =
    latitud === undefined || longitud === undefined ? null : `${tipoId}|${latitud}|${longitud}`;

  useEffect(() => {
    if (latitud === undefined || longitud === undefined || para === null) return;
    let vigente = true;
    const desde = { latitud, longitud };
    obtenerReportesCercanos(desde, { tipoId: tipoId ?? undefined })
      .then(({ datos }) => {
        if (vigente) setCercanos({ para, reportes: datos, desde });
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [latitud, longitud, tipoId, para]);

  // Mientras llega la búsqueda del lugar nuevo, la del anterior no se muestra.
  return cercanos?.para === para ? cercanos : null;
}
