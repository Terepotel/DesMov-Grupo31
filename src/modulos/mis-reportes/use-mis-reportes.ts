import { useState } from 'react';

import { mensajeDeError } from '@/servicios/api';
import { obtenerTiposDeReporte } from '@/servicios/catalogos';
import { obtenerMisReportes } from '@/servicios/reportes';
import type { Reporte } from '@/tipos';
import { useCarga } from '@/utilidades/use-carga';

/** El máximo que acepta la API por página. */
const POR_PAGINA = 100;

async function cargarPrimeraPagina() {
  const [reportes, tipos] = await Promise.all([
    obtenerMisReportes({ porPagina: POR_PAGINA }),
    obtenerTiposDeReporte(),
  ]);
  return { reportes: reportes.datos, total: reportes.meta.total, tipos: tipos.datos };
}

type PrimeraPagina = Awaited<ReturnType<typeof cargarPrimeraPagina>>;

/** Las páginas pedidas con «Ver más reportes», atadas a la primera página que las originó. */
type Siguientes = {
  base: PrimeraPagina;
  reportes: Reporte[];
  pagina: number;
  total: number;
  error: string | null;
};

/**
 * Los reportes del vecino (`GET /yo/reportes`), del más nuevo al más viejo. La primera página se
 * vuelve a pedir al volver a la pantalla (`useCarga`); entonces las siguientes se descartan, porque
 * pertenecen a la carga anterior.
 */
export function useMisReportes() {
  const { carga, reintentar } = useCarga(cargarPrimeraPagina);
  const [siguientes, setSiguientes] = useState<Siguientes | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);

  const base = carga.tipo === 'listo' ? carga.datos : null;
  const vigentes = base && siguientes?.base === base ? siguientes : null;

  const reportes = base ? sinRepetir([...base.reportes, ...(vigentes?.reportes ?? [])]) : [];
  const total = vigentes?.total ?? base?.total ?? 0;
  const pagina = vigentes?.pagina ?? 1;
  const hayMas = base !== null && pagina * POR_PAGINA < total;

  async function verMas() {
    if (!base || cargandoMas) return;
    const actual = vigentes ?? { base, reportes: [], pagina: 1, total: base.total, error: null };
    setCargandoMas(true);
    try {
      const respuesta = await obtenerMisReportes({
        pagina: actual.pagina + 1,
        porPagina: POR_PAGINA,
      });
      setSiguientes({
        base,
        reportes: [...actual.reportes, ...respuesta.datos],
        pagina: actual.pagina + 1,
        total: respuesta.meta.total,
        error: null,
      });
    } catch (error: unknown) {
      setSiguientes({ ...actual, error: mensajeDeError(error) });
    } finally {
      setCargandoMas(false);
    }
  }

  return {
    carga,
    reintentar,
    reportes,
    total,
    tipos: base?.tipos ?? [],
    hayMas,
    verMas,
    cargandoMas,
    errorMas: vigentes?.error ?? null,
  };
}

/** Si entró un reporte nuevo entre página y página, el último de una se repite en la otra. */
function sinRepetir(reportes: Reporte[]) {
  const vistos = new Set<string>();
  return reportes.filter((reporte) => {
    if (vistos.has(reporte.id)) return false;
    vistos.add(reporte.id);
    return true;
  });
}
