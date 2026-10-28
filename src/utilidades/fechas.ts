// Las fechas de la API son ISO con zona (`2026-09-14T10:22:00-03:00`). Se leen del texto, sin
// pasar por `Date`, para que la zona del teléfono no corra el día.

/** `2026-09-14T10:22:00-03:00` → `14/09/2026`. */
export function formatearFecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Este momento como lo pide la API, con la zona del teléfono: `2026-09-14T10:22:00-03:00`. Es lo
 * único que sale de `Date`: la hora del hecho la pone el teléfono (`creadoEn`).
 */
export function ahoraIso(ahora = new Date()) {
  const dos = (n: number) => String(n).padStart(2, '0');
  const minutosDeZona = -ahora.getTimezoneOffset();
  const signo = minutosDeZona >= 0 ? '+' : '-';
  const zona = `${signo}${dos(Math.floor(Math.abs(minutosDeZona) / 60))}:${dos(Math.abs(minutosDeZona) % 60)}`;
  return (
    `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}` +
    `T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}:${dos(ahora.getSeconds())}${zona}`
  );
}

/** `2026-09-18T09:20:00-03:00` → `18/09 · 09:20` (el año ya lo dice el número de seguimiento). */
export function formatearFechaHora(iso: string) {
  const [, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes} · ${iso.slice(11, 16)}`;
}
