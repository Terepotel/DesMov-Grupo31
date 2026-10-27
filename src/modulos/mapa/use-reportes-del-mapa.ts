import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Region } from 'react-native-maps';

import { obtenerReportes } from '@/servicios/reportes';
import type { EstadoReporte, Reporte } from '@/tipos';
import { cajaDesdeRegion } from '@/utilidades/geo';

export interface FiltrosDelMapa {
  estados: EstadoReporte[];
  /** `null` = todos los tipos (la API acepta uno solo). */
  tipoId: string | null;
}

/** Lo que devuelve la API por página como máximo: alcanza para lo que entra en una pantalla. */
const POR_PAGINA = 100;
const ESPERA_MS = 400;

/**
 * Los reportes de la parte del mapa que se ve. Vuelve a pedir cuando el mapa deja de moverse o
 * cambian los filtros, y al volver a la pantalla. Mientras carga, se siguen viendo los de antes.
 */
export function useReportesDelMapa(filtros: FiltrosDelMapa) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const pedido = useRef(0);

  const cargar = useCallback(async () => {
    if (!region) return;
    if (filtros.estados.length === 0) {
      setReportes([]);
      setCargando(false);
      setError(null);
      return;
    }
    const numero = ++pedido.current;
    setCargando(true);
    try {
      const respuesta = await obtenerReportes({
        caja: cajaDesdeRegion(region),
        estados: filtros.estados,
        tipoId: filtros.tipoId ?? undefined,
        porPagina: POR_PAGINA,
      });
      if (numero !== pedido.current) return;
      setReportes(respuesta.datos);
      setError(null);
    } catch (e: unknown) {
      if (numero !== pedido.current) return;
      setError(e instanceof Error ? e.message : 'Algo salió mal. Probá de nuevo.');
    } finally {
      if (numero === pedido.current) setCargando(false);
    }
  }, [region, filtros.estados, filtros.tipoId]);

  // Al mover el mapa, se espera a que se quede quieto antes de pedir.
  useEffect(() => {
    const temporizador = setTimeout(cargar, ESPERA_MS);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  // Al volver a la pantalla (por ejemplo, después de sumarse a un reporte), se refresca.
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      cargar();
    }, [cargar]),
  );

  return { reportes, cargando, error, alCambiarRegion: setRegion, reintentar: cargar };
}
