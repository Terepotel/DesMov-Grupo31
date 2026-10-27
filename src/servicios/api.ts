// Cliente HTTP de la API. Toda llamada pasa por `pedir`: arma la URL, agrega el token, corta por
// tiempo y convierte cualquier falla en un `ErrorApi` con un `mensaje` que se puede mostrar tal cual.

import type { RespuestaError } from '@/tipos';

const URL_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIEMPO_MAXIMO_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 10000;

/** Con `EXPO_PUBLIC_USAR_MOCKS=true` los servicios responden con `src/mocks` en vez de la API. */
export const USAR_MOCKS = process.env.EXPO_PUBLIC_USAR_MOCKS === 'true';

// Códigos propios de la app, para fallas que no llegan a ser una respuesta de la API.
export const ERROR_RED = 'ERROR_RED';
export const TIEMPO_AGOTADO = 'TIEMPO_AGOTADO';

export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
    readonly estadoHttp: number | null = null,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/** Lo que se le muestra a la persona: los mensajes de `ErrorApi` están escritos para ir tal cual. */
export function mensajeDeError(error: unknown) {
  return error instanceof Error ? error.message : 'Algo salió mal. Probá de nuevo.';
}

let token: string | null = null;

export function establecerToken(nuevo: string | null) {
  token = nuevo;
}

export function obtenerToken() {
  return token;
}

type Consulta = Record<string, string | number | undefined>;

interface OpcionesDePedido {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  consulta?: Consulta;
}

/** `R` es el sobre que devuelve la ruta: `RespuestaLista<T>` o `RespuestaUno<T>`. */
export async function pedir<R>(ruta: string, opciones: OpcionesDePedido = {}): Promise<R> {
  return (await pedirConEstado<R>(ruta, opciones)).datos;
}

/**
 * Igual que `pedir`, pero también devuelve el status HTTP de una respuesta buena: para las rutas
 * donde 200 y 201 dicen cosas distintas (sumarse: 201 la primera vez, 200 si ya estaba).
 */
export async function pedirConEstado<R>(
  ruta: string,
  { metodo = 'GET', cuerpo, consulta }: OpcionesDePedido = {},
): Promise<{ datos: R; estadoHttp: number }> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}${armarConsulta(consulta)}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch {
    if (controlador.signal.aborted) {
      throw new ErrorApi(
        TIEMPO_AGOTADO,
        'El servidor está tardando demasiado. Probá de nuevo en un rato.',
      );
    }
    throw new ErrorApi(
      ERROR_RED,
      'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.',
    );
  } finally {
    clearTimeout(temporizador);
  }

  const json = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = (json as RespuestaError | null)?.error;
    throw new ErrorApi(
      error?.codigo ?? 'ERROR_INTERNO',
      error?.mensaje ?? 'Algo salió mal de nuestro lado. Probá de nuevo en un rato.',
      respuesta.status,
    );
  }

  return { datos: json as R, estadoHttp: respuesta.status };
}

function armarConsulta(consulta: Consulta = {}) {
  const pares = Object.entries(consulta).filter(([, valor]) => valor !== undefined);
  if (pares.length === 0) return '';
  return `?${new URLSearchParams(pares.map(([clave, valor]) => [clave, String(valor)]))}`;
}
