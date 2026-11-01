// La cola de reportes sin subir (R1.7, NF1). Un reporte entra acá cuando el vecino toca «Enviar» y
// sale cuando la API lo recibe: así no se pierde aunque no haya señal o se cierre la app. No es el
// borrador (R1.10): ése es uno a medio hacer; acá van los terminados (consignas §8.1).
//
// Va en expo-sqlite. Las fotos y la nota ya están en `<documentos>/` y se guardan sólo sus rutas;
// se borran del teléfono recién cuando el reporte llega. Se sincroniza sola al volver la señal, al
// volver a la app y al abrirla con sesión (`useSincronizarCola`), sin que el vecino haga nada.

import * as Network from 'expo-network';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { Coordenadas, Reporte } from '@/tipos';
import { CENTRO_CIUDAD } from '@/utilidades/geo';
import { nuevoId } from '@/utilidades/reportes';

import { sincronizarAdhesiones } from './adhesiones-en-cola';
import { ERROR_RED, ErrorApi, TIEMPO_AGOTADO } from './api';
import { borrarArchivoLocal } from './archivos-locales';
import type { FotoElegida } from './fotos';
import type { NotaGrabada } from './notas-de-voz';
import { hayConexion } from './red';
import { crearReporte } from './reportes';
import { coordenadasDesdeDireccion, direccionDesdeCoordenadas } from './ubicacion';

/** Lo que tocó «Enviar», tal cual. El punto y la dirección pueden faltar si no había señal (P3). */
export interface ReporteEnCola {
  id: string;
  tipoId: string;
  descripcion: string | null;
  fotos: (FotoElegida & { id: string })[];
  audio: NotaGrabada | null;
  /** `null` si el vecino sólo escribió la calle sin señal: se busca al sincronizar. */
  coordenadas: Coordenadas | null;
  /** Lo que escribió el vecino, o la calculada; `null` si falta y hay que calcularla al subir. */
  direccion: string | null;
  creadoEn: string;
}

/**
 * `pendiente`: espera señal. `rechazado`: la API (o la calle escrita) lo rechazó con un error que
 * reenviar no arregla (§8.2); se queda para que el vecino sepa qué pasó (P11).
 */
export type EstadoEnCola = 'pendiente' | 'rechazado';

export interface EntradaDeCola {
  reporte: ReporteEnCola;
  estado: EstadoEnCola;
  /** El `mensaje` de la API tal cual, si se rechazó. */
  error: { codigo: string; mensaje: string } | null;
  actualizadoEn: string;
}

/** El vecino está mirando la pantalla: lo que pasa al enviar con él ahí. */
export type ResultadoDeEnvio =
  | { tipo: 'enviado'; reporte: Reporte }
  /** Sin señal o con una falla pasajera: queda en la cola y se sube solo. */
  | { tipo: 'en_cola' };

// Fallas que no dependen del reporte: con otro intento, más tarde, puede andar (§8.2).
const PASAJEROS = new Set([
  ERROR_RED,
  TIEMPO_AGOTADO,
  'ERROR_INTERNO',
  'ALMACEN_NO_DISPONIBLE',
  'ARCHIVO_NO_SUBIDO',
]);

/** La calle escrita sin señal no apareció al volver la señal (P3 → P11). */
export const DIRECCION_NO_ENCONTRADA = 'DIRECCION_NO_ENCONTRADA';

let base: SQLiteDatabase | null = null;

function abrir() {
  if (!base) {
    base = openDatabaseSync('cola.db');
    base.execSync(
      `CREATE TABLE IF NOT EXISTS reportes_en_cola (
        id TEXT PRIMARY KEY NOT NULL,
        usuario_id TEXT NOT NULL,
        reporte TEXT NOT NULL,
        estado TEXT NOT NULL,
        error TEXT,
        actualizado_en TEXT NOT NULL
      )`,
    );
  }
  return base;
}

interface Fila {
  reporte: string;
  estado: EstadoEnCola;
  error: string | null;
  actualizado_en: string;
}

// Lo que se ve de la cola, por usuario: las pantallas lo leen con `useColaDeReportes`.
let actual: { usuarioId: string; entradas: EntradaDeCola[] } = { usuarioId: '', entradas: [] };
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Vuelve a leer la base y avisa a las pantallas. Nunca lanza: sin base, la cola se ve vacía. */
function refrescar(usuarioId: string) {
  let entradas: EntradaDeCola[] = [];
  try {
    entradas = abrir()
      .getAllSync<Fila>(
        'SELECT reporte, estado, error, actualizado_en FROM reportes_en_cola WHERE usuario_id = ? ORDER BY actualizado_en DESC',
        [usuarioId],
      )
      .map((fila) => ({
        reporte: JSON.parse(fila.reporte) as ReporteEnCola,
        estado: fila.estado,
        error: fila.error ? (JSON.parse(fila.error) as EntradaDeCola['error']) : null,
        actualizadoEn: fila.actualizado_en,
      }));
  } catch {
    // Se muestra vacía; lo guardado sigue en la base para la próxima.
  }
  actual = { usuarioId, entradas };
  oyentes.forEach((oyente) => oyente());
}

/** Lo que está en la cola del usuario, del último tocado al primero. */
export function useColaDeReportes(usuarioId: string) {
  const vista = useSyncExternalStore(suscribir, () => actual);
  useEffect(() => {
    if (usuarioId && actual.usuarioId !== usuarioId) refrescar(usuarioId);
  }, [usuarioId]);
  return vista.usuarioId === usuarioId ? vista.entradas : [];
}

// Rechazos del servidor que la cátedra pidió mostrar con su propio estado (29/10, P11).
const FUERA_DE_LA_CIUDAD = new Set(['FUERA_DE_LA_CIUDAD', DIRECCION_NO_ENCONTRADA]);

/** Por qué la API no lo recibió: no es un dato de `Reporte` sino de la cola (P11). */
export interface RechazoDeLaCola {
  /** El `mensaje` de la API tal cual. */
  mensaje: string;
  fueraDeLaCiudad: boolean;
}

export type ReporteDeLaCola = Reporte & { rechazo: RechazoDeLaCola | null };

/** En una lista mezclada con los de la API: el motivo, si es uno de la cola que se rechazó. */
export function rechazoDe(reporte: Reporte): RechazoDeLaCola | null {
  return (reporte as Partial<ReporteDeLaCola>).rechazo ?? null;
}

/**
 * Uno de la cola como se muestra en las listas y el detalle: «Sin enviar», sin número (P2), o
 * rechazado con su motivo. Sin punto todavía, el centro de la ciudad: ninguna pantalla lo dibuja en
 * el mapa.
 */
function comoReporte(
  usuarioId: string,
  entrada: Omit<EntradaDeCola, 'actualizadoEn'>,
): ReporteDeLaCola {
  const { reporte, error } = entrada;
  return {
    id: reporte.id,
    codigo: '',
    tipoId: reporte.tipoId,
    descripcion: reporte.descripcion,
    audioUrl: reporte.audio?.uri ?? null,
    fotos: reporte.fotos.map((foto) => ({ id: foto.id, url: foto.uri, momento: 'problema' })),
    coordenadas: reporte.coordenadas ?? CENTRO_CIUDAD,
    direccion: reporte.direccion ?? 'Sin dirección todavía',
    zonaId: '',
    estado: 'recibido',
    autorId: usuarioId,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: reporte.creadoEn,
    sincronizado: false,
    rechazo:
      entrada.estado === 'rechazado' && error
        ? { mensaje: error.mensaje, fueraDeLaCiudad: FUERA_DE_LA_CIUDAD.has(error.codigo) }
        : null,
  };
}

/** Los que siguen en la cola, esperando señal o rechazados, del más nuevo al más viejo. */
export function useReportesDeLaCola(usuarioId: string) {
  const entradas = useColaDeReportes(usuarioId);
  return useMemo(
    () =>
      entradas
        .map((entrada) => comoReporte(usuarioId, entrada))
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [entradas, usuarioId],
  );
}

/**
 * Los de la cola primero y después los de la API, sin repetir: uno que se acaba de subir puede
 * estar en las dos un momento. `total` es el de la API más los que sólo están en la cola.
 */
export function mezclarConLaCola(locales: Reporte[], reportes: Reporte[], total: number) {
  const ids = new Set(locales.map((reporte) => reporte.id));
  const delServidor = reportes.filter((reporte) => !ids.has(reporte.id));
  return {
    reportes: [...locales, ...delServidor],
    total: total + locales.length - (reportes.length - delServidor.length),
  };
}

/** El detalle de uno que todavía no se subió, o `null` si no está en la cola. Nunca lanza. */
export function buscarEnLaCola(usuarioId: string, id: string): ReporteDeLaCola | null {
  try {
    const fila = abrir().getFirstSync<Pick<Fila, 'reporte' | 'estado' | 'error'>>(
      'SELECT reporte, estado, error FROM reportes_en_cola WHERE id = ? AND usuario_id = ?',
      [id, usuarioId],
    );
    if (!fila) return null;
    return comoReporte(usuarioId, {
      reporte: JSON.parse(fila.reporte) as ReporteEnCola,
      estado: fila.estado,
      error: fila.error ? (JSON.parse(fila.error) as EntradaDeCola['error']) : null,
    });
  } catch {
    return null;
  }
}

function ahora() {
  return new Date().toISOString();
}

function guardar(
  usuarioId: string,
  reporte: ReporteEnCola,
  estado: EstadoEnCola,
  error: EntradaDeCola['error'],
) {
  abrir().runSync(
    `INSERT INTO reportes_en_cola (id, usuario_id, reporte, estado, error, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET reporte = excluded.reporte, estado = excluded.estado,
       error = excluded.error, actualizado_en = excluded.actualizado_en`,
    [
      reporte.id,
      usuarioId,
      JSON.stringify(reporte),
      estado,
      error && JSON.stringify(error),
      ahora(),
    ],
  );
}

function borrarFila(id: string) {
  abrir().runSync('DELETE FROM reportes_en_cola WHERE id = ?', [id]);
}

/** Ya llegó: sale de la cola y sus archivos se borran del teléfono (la API tiene su copia). */
function sacar(reporte: ReporteEnCola) {
  borrarFila(reporte.id);
  reporte.fotos.forEach((foto) => borrarArchivoLocal(foto.uri));
  if (reporte.audio) borrarArchivoLocal(reporte.audio.uri);
}

function esPasajero(error: unknown) {
  return !(error instanceof ErrorApi) || PASAJEROS.has(error.codigo);
}

/** Avisa cuando la cola sube uno sin que el vecino esté mirando (para el aviso local, P2). */
type OyenteDeSubida = (reporte: Reporte) => void;
const oyentesDeSubida = new Set<OyenteDeSubida>();

export function alSubirDeLaCola(oyente: OyenteDeSubida) {
  oyentesDeSubida.add(oyente);
  return () => {
    oyentesDeSubida.delete(oyente);
  };
}

/**
 * Completa lo que sin señal no se pudo calcular (P3) y lo manda. Lanza el error de la API, o
 * `DIRECCION_NO_ENCONTRADA` si la calle escrita no existe.
 */
async function subir(reporte: ReporteEnCola): Promise<Reporte> {
  let { coordenadas, direccion } = reporte;
  if (!coordenadas) {
    if (!direccion) {
      throw new ErrorApi(DIRECCION_NO_ENCONTRADA, 'Al reporte le falta dónde está el problema.');
    }
    coordenadas = await coordenadasDesdeDireccion(direccion);
    if (!coordenadas) {
      // Sin señal, el buscador del sistema tampoco anda: es pasajero, no culpa de la calle.
      if (!(await hayConexion())) throw new ErrorApi(ERROR_RED, 'Sin conexión.');
      throw new ErrorApi(
        DIRECCION_NO_ENCONTRADA,
        `No encontramos «${direccion}». Hacé el reporte de nuevo marcando el lugar en el mapa.`,
      );
    }
  }
  if (!direccion) {
    direccion = await direccionDesdeCoordenadas(coordenadas);
    // La API pide una dirección: sin ella, se espera a tener señal para calcularla.
    if (!direccion) throw new ErrorApi(ERROR_RED, 'Sin conexión.');
  }
  return crearReporte({ ...reporte, coordenadas, direccion });
}

/** `ID_EN_USO` no sale por reenviar el mismo (§8.2): sólo si el id chocó con otro. Ids nuevos. */
function conIdsNuevos(reporte: ReporteEnCola): ReporteEnCola {
  return {
    ...reporte,
    id: nuevoId('rep'),
    fotos: reporte.fotos.map((foto) => ({ ...foto, id: nuevoId('fot') })),
  };
}

/**
 * Al tocar «Enviar»: primero queda en la cola, así no se pierde aunque se corte en el medio, y
 * después se intenta mandar. Si la API lo rechaza con el vecino mirando, sale de la cola y se lanza
 * el error, para que lo corrija en el mismo formulario (sus archivos quedan: son del formulario).
 * Si no se pudo guardar en la cola, se manda igual y una falla pasajera también se lanza: el
 * formulario sigue con todo para probar de nuevo.
 */
export async function enviarReporte(
  usuarioId: string,
  reporte: ReporteEnCola,
): Promise<ResultadoDeEnvio> {
  let encolado = true;
  try {
    guardar(usuarioId, reporte, 'pendiente', null);
  } catch {
    encolado = false;
  }
  refrescar(usuarioId);
  if (encolado && !(await hayConexion())) return { tipo: 'en_cola' };
  try {
    const enviado = await subir(reporte);
    if (encolado) sacar(reporte);
    refrescar(usuarioId);
    return { tipo: 'enviado', reporte: enviado };
  } catch (error) {
    if (encolado && esPasajero(error)) return { tipo: 'en_cola' };
    if (encolado) borrarFila(reporte.id);
    refrescar(usuarioId);
    throw error;
  }
}

let sincronizando: Promise<void> | null = null;

/**
 * Manda los pendientes, del más viejo al más nuevo. Corta en la primera falla pasajera (si no hay
 * señal para uno, no hay para ninguno). Nunca lanza.
 */
export function sincronizarCola(usuarioId: string): Promise<void> {
  sincronizando ??= (async () => {
    try {
      if (!(await hayConexion())) return;
      const filas = abrir().getAllSync<{ reporte: string }>(
        "SELECT reporte FROM reportes_en_cola WHERE usuario_id = ? AND estado = 'pendiente' ORDER BY actualizado_en",
        [usuarioId],
      );
      for (const { reporte: texto } of filas) {
        let reporte = JSON.parse(texto) as ReporteEnCola;
        try {
          const enviado = await subir(reporte);
          sacar(reporte);
          refrescar(usuarioId);
          oyentesDeSubida.forEach((oyente) => oyente(enviado));
        } catch (error) {
          if (error instanceof ErrorApi && error.codigo === 'NO_AUTENTICADO') break;
          if (error instanceof ErrorApi && error.codigo === 'ID_EN_USO') {
            borrarFila(reporte.id);
            reporte = conIdsNuevos(reporte);
            guardar(usuarioId, reporte, 'pendiente', null);
            continue;
          }
          if (esPasajero(error)) break;
          const { codigo, message } = error as ErrorApi;
          guardar(usuarioId, reporte, 'rechazado', { codigo, mensaje: message });
        }
      }
    } catch {
      // Sin base o sin red: se prueba de nuevo en la próxima.
    } finally {
      sincronizando = null;
      refrescar(usuarioId);
    }
  })();
  return sincronizando;
}

/** Ya lo vio: el rechazado sale de la cola y se borran sus archivos. */
export function quitarDeLaCola(usuarioId: string, id: string) {
  try {
    const fila = abrir().getFirstSync<{ reporte: string }>(
      'SELECT reporte FROM reportes_en_cola WHERE id = ? AND usuario_id = ?',
      [id, usuarioId],
    );
    if (fila) sacar(JSON.parse(fila.reporte) as ReporteEnCola);
  } catch {
    // Si no se puede, sigue en la lista: no se pierde nada.
  }
  refrescar(usuarioId);
}

/**
 * En el layout con sesión: sincroniza al abrir la app, al volver a ella y cuando vuelve la señal.
 */
export function useSincronizarCola(usuarioId: string | null) {
  useEffect(() => {
    if (!usuarioId) return;
    // Las adhesiones que quedaron sin señal salen junto con los reportes.
    const sincronizar = () => {
      void sincronizarCola(usuarioId);
      void sincronizarAdhesiones(usuarioId);
    };
    sincronizar();
    const red = Network.addNetworkStateListener((estado) => {
      if (estado.isInternetReachable ?? estado.isConnected) sincronizar();
    });
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar();
    });
    return () => {
      red.remove();
      app.remove();
    };
  }, [usuarioId]);
}
