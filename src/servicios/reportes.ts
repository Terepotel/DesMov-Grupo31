// Única puerta de lectura y escritura de reportes (PDF, pág. 5).

import { Directory, File, Paths } from 'expo-file-system';

import {
  cambiosDeEstadoMock,
  reportesMock,
  tiposDeReporteMock,
  usuariosMock,
  zonasMock,
} from '@/mocks';
import type {
  CambioDeEstado,
  Coordenadas,
  EstadoReporte,
  Reporte,
  RespuestaLista,
  RespuestaUno,
} from '@/tipos';
import { distanciaEnMetros, estaDentroDe, estaEnCaja, type Caja } from '@/utilidades/geo';

import { ErrorApi, pedir, pedirConEstado, USAR_MOCKS } from './api';
import type { FotoElegida } from './fotos';
import {
  ahoraMock,
  copiar,
  responderLista,
  responderUno,
  usuarioIdDeLaSesionMock,
  verificarEscenario,
} from './mock';

export interface FiltrosDeReportes {
  tipoId?: string;
  zonaId?: string;
  /** Sin estados, la API no trae los rechazados. */
  estados?: EstadoReporte[];
  /** Sólo lo que se ve en el mapa. */
  caja?: Caja;
  /** Alrededor de un punto; `radioMetros` de 1 a 50 000. Se puede combinar con `caja`. */
  cerca?: { coordenadas: Coordenadas; radioMetros: number };
  pagina?: number;
  porPagina?: number;
}

const masNuevoPrimero = (a: Reporte, b: Reporte) => b.creadoEn.localeCompare(a.creadoEn);

/** Los reportes públicos de la ciudad (el mapa). */
export function obtenerReportes(filtros: FiltrosDeReportes = {}): Promise<RespuestaLista<Reporte>> {
  const { tipoId, zonaId, estados, caja, cerca, pagina, porPagina } = filtros;

  if (USAR_MOCKS) {
    const filtrados = reportesMock.filter(
      (r) =>
        (tipoId === undefined || r.tipoId === tipoId) &&
        (zonaId === undefined || r.zonaId === zonaId) &&
        (estados ? estados.includes(r.estado) : r.estado !== 'rechazado') &&
        (caja === undefined || estaEnCaja(r.coordenadas, caja)) &&
        (cerca === undefined ||
          distanciaEnMetros(cerca.coordenadas, r.coordenadas) <= cerca.radioMetros),
    );
    // Con radio, la API ordena del más cercano al más lejano (DECISIONS P12).
    const ordenados = cerca
      ? [...filtrados].sort(
          (a, b) =>
            distanciaEnMetros(cerca.coordenadas, a.coordenadas) -
            distanciaEnMetros(cerca.coordenadas, b.coordenadas),
        )
      : [...filtrados].sort(masNuevoPrimero);
    return responderLista(ordenados, { pagina, porPagina });
  }

  return pedir('/reportes', {
    consulta: {
      tipoId,
      zonaId,
      estado: estados?.join(','),
      ...caja,
      latitud: cerca?.coordenadas.latitud,
      longitud: cerca?.coordenadas.longitud,
      radioMetros: cerca?.radioMetros,
      pagina,
      porPagina,
    },
  });
}

const ABIERTOS: EstadoReporte[] = ['recibido', 'en_revision', 'asignado'];

/** Radio con el que la API busca duplicados si no se le pide otro (R3.4). */
export const RADIO_CERCANOS_M = 50;

/**
 * Antes de crear uno: los reportes abiertos a menos de `radioMetros` (50 por defecto, 200 como
 * máximo), del más cercano al más lejano, sin los marcados como duplicado (API R9).
 */
export function obtenerReportesCercanos(
  coordenadas: Coordenadas,
  { tipoId, radioMetros }: { tipoId?: string; radioMetros?: number } = {},
): Promise<RespuestaLista<Reporte>> {
  if (USAR_MOCKS) {
    const radio = radioMetros ?? RADIO_CERCANOS_M;
    const cercanos = reportesMock
      .filter(
        (r) =>
          ABIERTOS.includes(r.estado) &&
          r.duplicadoDe === null &&
          (tipoId === undefined || r.tipoId === tipoId) &&
          distanciaEnMetros(coordenadas, r.coordenadas) <= radio,
      )
      .sort(
        (a, b) =>
          distanciaEnMetros(coordenadas, a.coordenadas) -
          distanciaEnMetros(coordenadas, b.coordenadas),
      );
    return responderLista(cercanos);
  }

  return pedir('/reportes/cercanos', {
    consulta: { latitud: coordenadas.latitud, longitud: coordenadas.longitud, tipoId, radioMetros },
  });
}

export async function obtenerReporte(id: string): Promise<Reporte> {
  if (USAR_MOCKS) {
    return responderUno(
      reportesMock.find((r) => r.id === id),
      new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404),
    );
  }
  return (await pedir<RespuestaUno<Reporte>>(`/reportes/${encodeURIComponent(id)}`)).datos;
}

/**
 * Por número de seguimiento (lo que trae el QR del mostrador, P17). La API lo acepta en minúsculas
 * y con espacios; igual se manda limpio.
 */
export async function obtenerReportePorCodigo(codigo: string): Promise<Reporte> {
  const limpio = codigo.trim().toUpperCase();
  if (USAR_MOCKS) {
    return responderUno(
      reportesMock.find((r) => r.codigo.toUpperCase() === limpio),
      new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404),
    );
  }
  return (await pedir<RespuestaUno<Reporte>>(`/reportes/codigo/${encodeURIComponent(limpio)}`))
    .datos;
}

// Mock de la tabla de adhesiones de la API (`reporteId|usuarioId`). El autor de un duplicado queda
// sumado al original (D5): Martín (`rep-00420`) ya está sumado a `rep-00412`.
const adhesionesMock = new Set<string>(['rep-00412|usr-085']);

/**
 * Sumarse a un reporte ajeno y abierto (R3.5). La API responde 201 la primera vez y 200 si ya
 * estaba sumado; en los dos casos, con el reporte actualizado.
 */
export async function sumarseAReporte(
  id: string,
): Promise<{ reporte: Reporte; yaEstaba: boolean }> {
  if (USAR_MOCKS) {
    // Mismo orden de reglas que la API (DECISIONS P15): 404, propio, ya estaba, cerrado.
    // Se trabaja sobre el del mock (no una copia): la adhesión tiene que quedar. `responderUno`
    // aplica el escenario (`errorRed`) y el 404.
    const reporte = reportesMock.find((r) => r.id === id);
    const noEncontrado = new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404);
    await responderUno(reporte, noEncontrado);
    if (!reporte) throw noEncontrado;
    const usuarioId = usuarioIdDeLaSesionMock();
    if (reporte.autorId === usuarioId) {
      throw new ErrorApi('ADHESION_A_REPORTE_PROPIO', 'Ya sos el autor de este reporte.', 422);
    }
    const clave = `${id}|${usuarioId}`;
    if (adhesionesMock.has(clave)) return { reporte: copiar(reporte), yaEstaba: true };
    if (reporte.estado === 'resuelto' || reporte.estado === 'rechazado') {
      throw new ErrorApi('REPORTE_CERRADO', 'Ese reporte ya está cerrado.', 422);
    }
    adhesionesMock.add(clave);
    reporte.adhesiones += 1;
    return { reporte: copiar(reporte), yaEstaba: false };
  }

  const { datos, estadoHttp } = await pedirConEstado<RespuestaUno<Reporte>>(
    `/reportes/${encodeURIComponent(id)}/adhesiones`,
    { metodo: 'POST' },
  );
  return { reporte: datos.datos, yaEstaba: estadoHttp === 200 };
}

/** Lo que manda el formulario de nuevo reporte. El resto (`codigo`, `zonaId`, `estado`…) lo pone el servidor. */
export interface NuevoReporte {
  /** Lo genera el teléfono (`nuevoId('rep')`): reenviar con el mismo id no duplica. */
  id: string;
  tipoId: string;
  descripcion: string | null;
  /** 1 o 2 (API R1). `id` también lo pone el teléfono. */
  fotos: (FotoElegida & { id: string })[];
  coordenadas: Coordenadas;
  direccion: string;
  /** Cuándo lo hizo el vecino, no cuándo se subió. */
  creadoEn: string;
}

/**
 * Crea un reporte (R1). Primero sube cada foto con `POST /archivos` y después manda el reporte con
 * esas URLs. Devuelve el reporte como quedó en el servidor, con su número de seguimiento (R1.6).
 */
export async function crearReporte(nuevo: NuevoReporte): Promise<Reporte> {
  if (USAR_MOCKS) return crearReporteMock(nuevo);

  const fotos = [];
  for (const foto of nuevo.fotos) {
    fotos.push({ id: foto.id, url: await subirFoto(foto) });
  }
  const { datos } = await pedir<RespuestaUno<Reporte>>('/reportes', {
    metodo: 'POST',
    cuerpo: {
      id: nuevo.id,
      tipoId: nuevo.tipoId,
      descripcion: nuevo.descripcion,
      audioUrl: null,
      fotos,
      coordenadas: nuevo.coordenadas,
      direccion: nuevo.direccion,
      creadoEn: nuevo.creadoEn,
    },
  });
  return datos;
}

async function subirFoto(foto: FotoElegida): Promise<string> {
  const formulario = new FormData();
  // El `fetch` global de Expo (`expo/fetch`) no acepta el `{ uri, name, type }` de React Native:
  // el archivo va como `File` de expo-file-system, que se lee como un `Blob`.
  formulario.append('archivo', new File(foto.uri));
  const { datos } = await pedir<RespuestaUno<{ url: string }>>('/archivos', {
    metodo: 'POST',
    cuerpo: formulario,
  });
  return datos.url;
}

// Como `POST /archivos`: la foto subida es otra copia, así el formulario puede borrar la suya.
function subirFotoMock(foto: FotoElegida) {
  const carpeta = new Directory(Paths.document, 'archivos-mock');
  carpeta.create({ idempotent: true, intermediates: true });
  const subida = new File(carpeta, new File(foto.uri).name);
  new File(foto.uri).copySync(subida, { overwrite: true });
  return subida.uri;
}

// Mismas reglas que la API para lo que el formulario no puede prevenir (§8.2). El reporte nuevo
// queda en los mocks: aparece en «Mis reportes», en el mapa y en el detalle.
async function crearReporteMock(nuevo: NuevoReporte): Promise<Reporte> {
  verificarEscenario();
  const autorId = usuarioIdDeLaSesionMock();
  if (!autorId) throw new ErrorApi('NO_AUTENTICADO', 'Tenés que ingresar de nuevo.', 401);

  // Idempotente por id: si ya llegó (un reintento), se devuelve el mismo.
  const existente = reportesMock.find((r) => r.id === nuevo.id);
  if (existente) {
    if (existente.autorId !== autorId) {
      throw new ErrorApi('ID_EN_USO', 'Ese identificador ya está en uso.', 409);
    }
    return copiar(existente);
  }
  if (nuevo.fotos.length === 0) {
    throw new ErrorApi('FOTO_REQUERIDA', 'El reporte necesita al menos una foto.', 422);
  }
  if (!tiposDeReporteMock.some((t) => t.id === nuevo.tipoId)) {
    throw new ErrorApi('TIPO_NO_ENCONTRADO', 'Elegí qué tipo de problema es.', 422);
  }
  const zona = zonasMock.find((z) => estaDentroDe(nuevo.coordenadas, z.limite));
  if (!zona) {
    throw new ErrorApi(
      'FUERA_DE_LA_CIUDAD',
      'Ese punto queda fuera de Gualeguaychú. Corregilo en el mapa.',
      422,
    );
  }

  // `GCHU-<año>-<5 dígitos>`, correlativo por año (API R4).
  const anio = nuevo.creadoEn.slice(0, 4);
  const ultimo = Math.max(
    0,
    ...reportesMock
      .filter((r) => r.codigo.startsWith(`GCHU-${anio}-`))
      .map((r) => Number(r.codigo.slice(-5))),
  );
  const reporte: Reporte = {
    id: nuevo.id,
    codigo: `GCHU-${anio}-${String(ultimo + 1).padStart(5, '0')}`,
    tipoId: nuevo.tipoId,
    descripcion: nuevo.descripcion,
    audioUrl: null,
    fotos: nuevo.fotos.map((f) => ({ id: f.id, url: subirFotoMock(f), momento: 'problema' })),
    coordenadas: nuevo.coordenadas,
    direccion: nuevo.direccion,
    zonaId: zona.id,
    estado: 'recibido',
    autorId,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: nuevo.creadoEn,
    sincronizado: true,
  };
  reportesMock.push(reporte);
  cambiosDeEstadoMock.push({
    id: `cam-${reporte.id}-1`,
    reporteId: reporte.id,
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: reporte.creadoEn,
  });
  return copiar(reporte);
}

/** Los reportes del usuario de la sesión, del más nuevo al más viejo. */
export function obtenerMisReportes(
  paginado: { pagina?: number; porPagina?: number } = {},
): Promise<RespuestaLista<Reporte>> {
  if (USAR_MOCKS) {
    const autorId = usuarioIdDeLaSesionMock();
    const propios = reportesMock.filter((r) => r.autorId === autorId);
    return responderLista([...propios].sort(masNuevoPrimero), paginado);
  }
  return pedir('/yo/reportes', { consulta: paginado });
}

/** «Qué fue pasando»: los cambios de estado, del más viejo al más nuevo. */
export function obtenerCambiosDeEstado(reporteId: string): Promise<RespuestaLista<CambioDeEstado>> {
  if (USAR_MOCKS) {
    const cambios = cambiosDeEstadoMock
      .filter((c) => c.reporteId === reporteId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    return responderLista(cambios);
  }
  return pedir(`/reportes/${encodeURIComponent(reporteId)}/cambios`);
}

export interface FiltrosDeBandeja {
  /** Sin zona, la API usa la del operador; `'todas'` trae todas. */
  zonaId?: string;
  tipoId?: string;
  estados?: EstadoReporte[];
  pagina?: number;
  porPagina?: number;
}

/** Sólo operadores: los reportes abiertos, los más apoyados primero y, a igualdad, el más viejo. */
export function obtenerBandeja(filtros: FiltrosDeBandeja = {}): Promise<RespuestaLista<Reporte>> {
  const { zonaId, tipoId, estados, pagina, porPagina } = filtros;

  if (USAR_MOCKS) {
    const operador = usuariosMock.find((u) => u.id === usuarioIdDeLaSesionMock());
    if (operador?.rol !== 'operador') {
      return Promise.reject(
        new ErrorApi('SIN_PERMISO', 'Esta parte es sólo para operadores.', 403),
      );
    }
    const zona = zonaId ?? operador.zonaId ?? 'todas';
    const abiertos = reportesMock.filter(
      (r) =>
        (estados ?? ABIERTOS).includes(r.estado) &&
        ABIERTOS.includes(r.estado) &&
        (zona === 'todas' || r.zonaId === zona) &&
        (tipoId === undefined || r.tipoId === tipoId),
    );
    const ordenados = [...abiertos].sort(
      (a, b) =>
        b.adhesiones - a.adhesiones ||
        a.creadoEn.localeCompare(b.creadoEn) ||
        a.id.localeCompare(b.id),
    );
    return responderLista(ordenados, { pagina, porPagina });
  }

  return pedir('/bandeja', {
    consulta: { zonaId, tipoId, estado: estados?.join(','), pagina, porPagina },
  });
}

/**
 * A qué estados puede pasar un reporte con `PATCH /estado` (máquina de estados de la API, D3).
 * «Asignado a cuadrilla» no está: se llega sólo asignando una cuadrilla (R4.3).
 */
export const DESTINOS_POR_ESTADO: Record<EstadoReporte, readonly EstadoReporte[]> = {
  recibido: ['en_revision', 'rechazado'],
  en_revision: ['rechazado'],
  asignado: ['resuelto', 'en_revision', 'rechazado'],
  resuelto: [],
  rechazado: [],
};

/** La API recorta el comentario a este largo (DECISIONS P18). */
export const LARGO_MAXIMO_COMENTARIO = 1000;

/** Como lo guarda la API: sin espacios de más, `""` pasa a `null`. */
export function limpiarComentario(comentario: string | null | undefined): string | null {
  const texto = (comentario ?? '').replace(/\s+/g, ' ').trim();
  return texto === '' ? null : texto;
}

/**
 * Sólo operadores (R4.2): cambia el estado y deja un `CambioDeEstado` con el comentario. Rechazar
 * exige comentario (`MOTIVO_REQUERIDO`); un paso que no está en la máquina es `TRANSICION_INVALIDA`.
 * Devuelve el reporte actualizado.
 */
export async function cambiarEstado(
  id: string,
  { estado, comentario }: { estado: EstadoReporte; comentario?: string | null },
): Promise<Reporte> {
  if (USAR_MOCKS) {
    const operadorId = usuarioIdDeLaSesionMock();
    const operador = usuariosMock.find((u) => u.id === operadorId);
    if (operador?.rol !== 'operador') {
      throw new ErrorApi('SIN_PERMISO', 'Esta parte es sólo para operadores.', 403);
    }
    const reporte = reportesMock.find((r) => r.id === id);
    const noEncontrado = new ErrorApi('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.', 404);
    await responderUno(reporte, noEncontrado);
    if (!reporte) throw noEncontrado;
    // Mismo orden de reglas que la API: transición, después motivo.
    if (estado === 'asignado') {
      throw new ErrorApi('CUADRILLA_REQUERIDA', 'Para asignar, elegí una cuadrilla.', 422);
    }
    if (!DESTINOS_POR_ESTADO[reporte.estado].includes(estado)) {
      throw new ErrorApi(
        'TRANSICION_INVALIDA',
        'Ese cambio de estado no es posible desde el estado actual.',
        422,
      );
    }
    const texto = limpiarComentario(comentario);
    if (estado === 'rechazado' && texto === null) {
      throw new ErrorApi('MOTIVO_REQUERIDO', 'Contá por qué se rechaza el reporte.', 422);
    }
    // Se trabaja sobre el del mock (no una copia): el cambio tiene que quedar.
    reporte.estado = estado;
    const numero = cambiosDeEstadoMock.filter((c) => c.reporteId === id).length + 1;
    cambiosDeEstadoMock.push({
      id: `cam-${id}-${numero}`,
      reporteId: id,
      estado,
      comentario: texto,
      operadorId,
      fechaHora: ahoraMock(),
    });
    return copiar(reporte);
  }

  const respuesta = await pedir<RespuestaUno<Reporte>>(
    `/reportes/${encodeURIComponent(id)}/estado`,
    { metodo: 'PATCH', cuerpo: { estado, comentario: limpiarComentario(comentario) } },
  );
  return respuesta.datos;
}
