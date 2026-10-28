import { useCallback, useState } from 'react';

import { mensajeDeError } from '@/servicios/api';
import { obtenerTiposDeReporte, obtenerZonas } from '@/servicios/catalogos';
import { obtenerBandeja } from '@/servicios/reportes';
import type { Reporte, RespuestaLista } from '@/tipos';
import { useCarga } from '@/utilidades/use-carga';

import type { FiltrosDeLaBandeja } from './filtros-bandeja';

/** El máximo que acepta la API por página. */
const POR_PAGINA = 100;

async function cargarCatalogos() {
  const [tipos, zonas] = await Promise.all([obtenerTiposDeReporte(), obtenerZonas()]);
  return { tipos: tipos.datos, zonas: zonas.datos };
}

const VACIA: RespuestaLista<Reporte> = {
  datos: [],
  meta: { total: 0, pagina: 1, porPagina: POR_PAGINA },
};

function pedirPagina(filtros: FiltrosDeLaBandeja, pagina: number) {
  // Sin ningún estado marcado no hay nada que pedir.
  if (filtros.estados.length === 0) return Promise.resolve(VACIA);
  return obtenerBandeja({
    zonaId: filtros.zonaId,
    tipoId: filtros.tipoId ?? undefined,
    estados: filtros.estados,
    pagina,
    porPagina: POR_PAGINA,
  });
}

/** Las páginas pedidas con «Ver más», atadas a la primera página que las originó. */
type Siguientes = {
  base: RespuestaLista<Reporte>;
  reportes: Reporte[];
  pagina: number;
  total: number;
  error: string | null;
};

/**
 * La bandeja del operador (`GET /bandeja`) con sus filtros: vuelve a pedir cuando cambian y al
 * volver a la pantalla. Los catálogos (tipos y zonas) se piden aparte, una vez.
 */
export function useBandeja(filtros: FiltrosDeLaBandeja) {
  const catalogos = useCarga(cargarCatalogos);
  const cargarPrimera = useCallback(() => pedirPagina(filtros, 1), [filtros]);
  const { carga, reintentar } = useCarga(cargarPrimera);
  const [siguientes, setSiguientes] = useState<Siguientes | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);

  const base = carga.tipo === 'listo' ? carga.datos : null;
  const vigentes = base && siguientes?.base === base ? siguientes : null;

  const reportes = base ? sinRepetir([...base.datos, ...(vigentes?.reportes ?? [])]) : [];
  const total = vigentes?.total ?? base?.meta.total ?? 0;
  const pagina = vigentes?.pagina ?? 1;
  const hayMas = base !== null && pagina * POR_PAGINA < total;

  async function verMas() {
    if (!base || cargandoMas) return;
    const actual = vigentes ?? {
      base,
      reportes: [],
      pagina: 1,
      total: base.meta.total,
      error: null,
    };
    setCargandoMas(true);
    try {
      const respuesta = await pedirPagina(filtros, actual.pagina + 1);
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
    tipos: catalogos.carga.tipo === 'listo' ? catalogos.carga.datos.tipos : null,
    zonas: catalogos.carga.tipo === 'listo' ? catalogos.carga.datos.zonas : null,
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
