// Ayudas para que los servicios respondan con `src/mocks` (EXPO_PUBLIC_USAR_MOCKS=true) igual que
// la API: mismos sobres, mismos errores (`ErrorApi`) y siempre asíncronos.

import { errorDeRedMock, listaVaciaMock } from '@/mocks';
import type { RespuestaLista } from '@/tipos';

import { ErrorApi, obtenerToken } from './api';

/** Casos feos del PDF que no salen de los datos: la lista vacía y el error de red. */
export type EscenarioMock = 'normal' | 'vacio' | 'errorRed';

let escenario: EscenarioMock = 'normal';

export function establecerEscenarioMock(nuevo: EscenarioMock) {
  escenario = nuevo;
}

const PREFIJO_TOKEN = 'mock-';

export function tokenMock(usuarioId: string) {
  return `${PREFIJO_TOKEN}${usuarioId}`;
}

/** El id del usuario de la sesión mock, o `null` si el token no es de los mocks. */
export function usuarioIdDeLaSesionMock() {
  const token = obtenerToken();
  return token?.startsWith(PREFIJO_TOKEN) ? token.slice(PREFIJO_TOKEN.length) : null;
}

/** El instante actual como lo escribe la API: ISO con la zona del teléfono (`…T10:22:00-03:00`). */
export function ahoraMock() {
  const ahora = new Date();
  const desfase = -ahora.getTimezoneOffset();
  const signo = desfase >= 0 ? '+' : '-';
  const dos = (n: number) => String(Math.abs(n)).padStart(2, '0');
  const local = new Date(ahora.getTime() + desfase * 60_000).toISOString().slice(0, 19);
  return `${local}${signo}${dos(Math.trunc(desfase / 60))}:${dos(desfase % 60)}`;
}

export function copiar<T>(dato: T): T {
  return JSON.parse(JSON.stringify(dato)) as T;
}

export async function responderLista<T>(
  datos: T[],
  { pagina = 1, porPagina = 20 }: { pagina?: number; porPagina?: number } = {},
): Promise<RespuestaLista<T>> {
  verificarEscenario();
  if (escenario === 'vacio') return { datos: [], meta: { ...listaVaciaMock.meta, porPagina } };
  const desde = (pagina - 1) * porPagina;
  return {
    datos: copiar(datos.slice(desde, desde + porPagina)),
    meta: { total: datos.length, pagina, porPagina },
  };
}

export async function responderUno<T>(dato: T | undefined, siNoExiste: ErrorApi): Promise<T> {
  verificarEscenario();
  if (dato === undefined) throw siNoExiste;
  return copiar(dato);
}

/** Para las escrituras: con `errorRed`, falla igual que una lectura. */
export function verificarEscenario() {
  if (escenario === 'errorRed') {
    throw new ErrorApi(errorDeRedMock.error.codigo, errorDeRedMock.error.mensaje);
  }
}
