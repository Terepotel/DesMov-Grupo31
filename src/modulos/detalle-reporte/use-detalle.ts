import { useRef, useState } from 'react';

import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { sumarseAReporte } from '@/servicios/reportes';
import type { Reporte } from '@/tipos';

import { cargarCambios, type CargaCambios, type DetalleReporte } from './cargar-detalle';

// Lo que cambia en la pantalla después de cargar (reintentar los cambios, sumarse) queda atado a
// los datos de esa carga: si la pantalla vuelve a cargar, manda lo que trajo la carga nueva.

/** «Qué fue pasando», con su propio «Probar de nuevo» para no recargar toda la pantalla. */
export function useCambios(datos: DetalleReporte) {
  const [local, setLocal] = useState<{ de: DetalleReporte; carga: CargaCambios } | null>(null);
  const carga = local?.de === datos ? local.carga : datos.cambios;

  async function reintentar() {
    setLocal({ de: datos, carga: { tipo: 'cargando' } });
    setLocal({ de: datos, carga: await cargarCambios(datos.reporte.id) });
  }

  return { carga, reintentar };
}

export type ResultadoSumarse =
  | { tipo: 'nada' }
  | { tipo: 'enviando' }
  | { tipo: 'sumado'; yaEstaba: boolean }
  /** `definitivo`: la API dice que a este reporte no se puede sumar (§8.2); no se vuelve a ofrecer. */
  | { tipo: 'error'; mensaje: string; definitivo: boolean };

const ERRORES_DEFINITIVOS = ['ADHESION_A_REPORTE_PROPIO', 'REPORTE_CERRADO'];

/** R3.5: sumarse a un reporte ajeno y abierto. El reporte que devuelve la API reemplaza al cargado. */
export function useSumarse(original: Reporte) {
  const [local, setLocal] = useState<{
    de: Reporte;
    reporte: Reporte;
    resultado: ResultadoSumarse;
  } | null>(null);
  // Un doble toque no manda dos pedidos: el estado tarda un render en bloquear el botón.
  const enviando = useRef(false);
  const vigente = local?.de === original ? local : null;
  const reporte = vigente?.reporte ?? original;
  const resultado: ResultadoSumarse = vigente?.resultado ?? { tipo: 'nada' };
  // Ya se sumó (o ya estaba), o la API dijo que no se puede: el botón no vuelve a aparecer.
  const terminado =
    resultado.tipo === 'sumado' || (resultado.tipo === 'error' && resultado.definitivo);

  async function sumarme() {
    if (enviando.current) return;
    enviando.current = true;
    setLocal({ de: original, reporte, resultado: { tipo: 'enviando' } });
    try {
      const respuesta = await sumarseAReporte(original.id);
      setLocal({
        de: original,
        reporte: respuesta.reporte,
        resultado: { tipo: 'sumado', yaEstaba: respuesta.yaEstaba },
      });
    } catch (error) {
      const definitivo = error instanceof ErrorApi && ERRORES_DEFINITIVOS.includes(error.codigo);
      setLocal({
        de: original,
        reporte,
        resultado: { tipo: 'error', mensaje: mensajeDeError(error), definitivo },
      });
    } finally {
      enviando.current = false;
    }
  }

  return { reporte, resultado, terminado, sumarme };
}
