import type { Cuadrilla } from '@/tipos';

/** «Cuadrilla 2 — Bacheo · pavimento» (P13): la especialidad se muestra, nunca el id. */
export function describirCuadrilla(cuadrilla: Cuadrilla) {
  return `${cuadrilla.nombre} · ${cuadrilla.especialidad}`;
}
