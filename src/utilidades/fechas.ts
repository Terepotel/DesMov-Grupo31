// Las fechas de la API son ISO con zona (`2026-09-14T10:22:00-03:00`). Se leen del texto, sin
// pasar por `Date`, para que la zona del teléfono no corra el día.

/** `2026-09-14T10:22:00-03:00` → `14/09/2026`. */
export function formatearFecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}
