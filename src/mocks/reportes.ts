import type { CambioDeEstado, Foto, Reporte } from '../tipos';

function foto(id: string, momento: Foto['momento'] = 'problema'): Foto {
  return { id, url: `https://media.example.invalid/${id}.jpg`, momento };
}

function reporte(numero: string, campos: Partial<Reporte>): Reporte {
  return {
    id: `rep-${numero}`,
    codigo: `GCHU-2026-${numero}`,
    tipoId: 'tip-bache',
    descripcion: 'Pozo grande en la mano hacia el centro, pasa el agua.',
    audioUrl: null,
    fotos: [foto(`fot-${numero}`)],
    coordenadas: { latitud: -33.0089, longitud: -58.5142 },
    direccion: 'Rocamora 1240',
    zonaId: 'zon-norte',
    estado: 'recibido',
    autorId: 'usr-084',
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: '2026-09-14T10:22:00-03:00',
    sincronizado: true,
    ...campos,
  };
}

export const motivoRechazoMock =
  'La inspección constató que el daño está dentro de un terreno privado y no corresponde a la vía pública. La cuadrilla municipal no puede intervenir sin la autorización del propietario. Por favor, comuníquese con el Centro de Atención al Vecino para recibir orientación sobre el trámite correspondiente y presentar la documentación necesaria. Este rechazo no implica que el problema haya sido reparado.';

export const reportesMock: Reporte[] = [
  reporte('00412', {
    estado: 'asignado',
    cuadrillaId: 'cua-02',
    adhesiones: 3,
    fotos: [foto('fot-901')],
  }),
  reporte('00413', {
    tipoId: 'tip-luminaria',
    descripcion: null,
    audioUrl: 'https://media.example.invalid/audio-00413.m4a',
    direccion: 'Urquiza 1500',
    coordenadas: { latitud: -33.03, longitud: -58.51 },
    zonaId: 'zon-sur',
    estado: 'resuelto',
    cuadrillaId: 'cua-03',
    fotos: [foto('fot-902'), foto('fot-903', 'arreglo')],
    creadoEn: '2026-09-15T09:00:00-03:00',
    adhesiones: 8,
  }),
  reporte('00414', {
    tipoId: 'tip-basura',
    descripcion: 'Bolsas de basura acumuladas en la esquina.',
    direccion: 'Costanera 300',
    coordenadas: { latitud: -33.01, longitud: -58.48 },
    zonaId: 'zon-este',
    estado: 'en_revision',
    autorId: 'usr-085',
    fotos: [foto('fot-904'), foto('fot-905')],
    creadoEn: '2026-09-16T12:30:00-03:00',
  }),
  reporte('00415', {
    tipoId: 'tip-rama',
    descripcion: 'Rama sobre el cableado.',
    direccion: 'Camino de las Quintas 800',
    coordenadas: { latitud: -33.01, longitud: -58.54 },
    zonaId: 'zon-oeste',
    audioUrl: 'file:///mock/audio-00415.m4a',
    fotos: [{ id: 'fot-906', url: 'file:///mock/fot-906.jpg', momento: 'problema' }],
    sincronizado: false,
    creadoEn: '2026-09-17T14:00:00-03:00',
  }),
  reporte('00416', {
    tipoId: 'tip-agua',
    descripcion: 'Pérdida de agua dentro de un terreno privado.',
    direccion: 'San Martín 700',
    coordenadas: { latitud: -33.034, longitud: -58.515 },
    zonaId: 'zon-sur',
    estado: 'rechazado',
    creadoEn: '2026-09-18T10:00:00-03:00',
  }),
  reporte('00417', {
    tipoId: 'tip-semaforo',
    descripcion: 'El semáforo no enciende.',
    direccion: 'Costanera y San Martín',
    coordenadas: { latitud: -33.015, longitud: -58.485 },
    zonaId: 'zon-este',
    creadoEn: '2026-09-19T08:00:00-03:00',
    autorId: 'usr-085',
  }),
  reporte('00418', {
    tipoId: 'tip-vereda',
    descripcion: 'Baldosas levantadas que dificultan el paso.',
    direccion: 'Perón 900',
    coordenadas: { latitud: -33.025, longitud: -58.545 },
    zonaId: 'zon-oeste',
    creadoEn: '2026-09-20T11:00:00-03:00',
  }),
  reporte('00419', {
    tipoId: 'tip-otro',
    descripcion: 'Cartel caído sobre la calle.',
    direccion: 'Rocamora 1300',
    coordenadas: { latitud: -33.0095, longitud: -58.515 },
    creadoEn: '2026-09-21T15:00:00-03:00',
  }),
  reporte('00420', {
    descripcion: 'El mismo pozo frente a Rocamora 1240.',
    duplicadoDe: 'rep-00412',
    coordenadas: { latitud: -33.00895, longitud: -58.51425 },
    autorId: 'usr-085',
    creadoEn: '2026-09-22T09:00:00-03:00',
  }),
];

function cambio(
  reporteId: string,
  numero: number,
  estado: CambioDeEstado['estado'],
  fechaHora: string,
  comentario: string | null,
  operadorId: string | null,
): CambioDeEstado {
  return { id: `cam-${reporteId}-${numero}`, reporteId, estado, fechaHora, comentario, operadorId };
}

export const cambiosDeEstadoMock: CambioDeEstado[] = [
  ...reportesMock.map((item) => cambio(item.id, 1, 'recibido', item.creadoEn, null, null)),
  cambio(
    'rep-00412',
    2,
    'en_revision',
    '2026-09-15T08:40:00-03:00',
    'Verificado en el lugar',
    'usr-003',
  ),
  cambio(
    'rep-00412',
    3,
    'asignado',
    '2026-09-18T08:00:00-03:00',
    'Asignado a Cuadrilla 2 — Bacheo',
    'usr-003',
  ),
  cambio(
    'rep-00413',
    2,
    'en_revision',
    '2026-09-16T08:00:00-03:00',
    'Verificada la luminaria',
    'usr-004',
  ),
  cambio(
    'rep-00413',
    3,
    'asignado',
    '2026-09-17T08:00:00-03:00',
    'Asignado a Cuadrilla 3 — Alumbrado',
    'usr-004',
  ),
  cambio(
    'rep-00413',
    4,
    'en_revision',
    '2026-09-18T08:00:00-03:00',
    'Se requiere revisar también el cableado antes de completar el arreglo',
    'usr-004',
  ),
  cambio(
    'rep-00413',
    5,
    'resuelto',
    '2026-09-19T08:00:00-03:00',
    'Luminaria y cableado reparados; foto adjunta',
    'usr-004',
  ),
  cambio(
    'rep-00414',
    2,
    'en_revision',
    '2026-09-17T08:00:00-03:00',
    'Inspección de residuos pendiente',
    'usr-005',
  ),
  cambio('rep-00416', 2, 'rechazado', '2026-09-19T10:00:00-03:00', motivoRechazoMock, 'usr-004'),
];
