import type { Cuadrilla, TipoDeReporte, Usuario, Zona } from '../tipos';

export const tiposDeReporteMock: TipoDeReporte[] = [
  {
    id: 'tip-bache',
    nombre: 'Bache',
    icono: 'warning-outline',
    color: '#C1440E',
    areaResponsable: 'Obras Públicas',
  },
  {
    id: 'tip-luminaria',
    nombre: 'Luminaria',
    icono: 'bulb-outline',
    color: '#B7791F',
    areaResponsable: 'Alumbrado Público',
  },
  {
    id: 'tip-basura',
    nombre: 'Basura',
    icono: 'trash-outline',
    color: '#287D3C',
    areaResponsable: 'Higiene Urbana',
  },
  {
    id: 'tip-rama',
    nombre: 'Rama o árbol',
    icono: 'leaf-outline',
    color: '#237A57',
    areaResponsable: 'Espacios Verdes',
  },
  {
    id: 'tip-agua',
    nombre: 'Agua o cloaca',
    icono: 'water-outline',
    color: '#246BB2',
    areaResponsable: 'Obras Sanitarias',
  },
  {
    id: 'tip-semaforo',
    nombre: 'Semáforo',
    icono: 'stop-circle-outline',
    color: '#AD3030',
    areaResponsable: 'Tránsito',
  },
  {
    id: 'tip-vereda',
    nombre: 'Vereda',
    icono: 'walk-outline',
    color: '#795548',
    areaResponsable: 'Obras Públicas',
  },
  {
    id: 'tip-otro',
    nombre: 'Otro',
    icono: 'help-circle-outline',
    color: '#6750A4',
    areaResponsable: 'Atención al Vecino',
  },
];

export const zonasMock: Zona[] = [
  {
    id: 'zon-norte',
    nombre: 'Zona Norte',
    referente: 'Corralón Norte',
    limite: [
      { latitud: -32.99, longitud: -58.53 },
      { latitud: -32.99, longitud: -58.49 },
      { latitud: -33.02, longitud: -58.49 },
      { latitud: -33.02, longitud: -58.53 },
      { latitud: -32.99, longitud: -58.53 },
    ],
  },
  {
    id: 'zon-sur',
    nombre: 'Zona Sur',
    referente: 'Corralón Sur',
    limite: [
      { latitud: -33.02, longitud: -58.53 },
      { latitud: -33.02, longitud: -58.49 },
      { latitud: -33.05, longitud: -58.49 },
      { latitud: -33.05, longitud: -58.53 },
      { latitud: -33.02, longitud: -58.53 },
    ],
  },
  {
    id: 'zon-este',
    nombre: 'Zona Este',
    referente: 'Corralón Este',
    limite: [
      { latitud: -32.99, longitud: -58.49 },
      { latitud: -32.99, longitud: -58.47 },
      { latitud: -33.05, longitud: -58.47 },
      { latitud: -33.05, longitud: -58.49 },
      { latitud: -32.99, longitud: -58.49 },
    ],
  },
  {
    id: 'zon-oeste',
    nombre: 'Zona Oeste',
    referente: 'Corralón Oeste',
    limite: [
      { latitud: -32.99, longitud: -58.56 },
      { latitud: -32.99, longitud: -58.53 },
      { latitud: -33.05, longitud: -58.53 },
      { latitud: -33.05, longitud: -58.56 },
      { latitud: -32.99, longitud: -58.56 },
    ],
  },
];

export const usuariosMock: Usuario[] = [
  {
    id: 'usr-084',
    nombre: 'Norma Pereyra',
    email: 'norma@example.com',
    telefono: '3446-412233',
    rol: 'vecino',
    zonaId: null,
    avisosActivos: true,
    creadoEn: '2026-08-30T19:10:00-03:00',
  },
  {
    id: 'usr-085',
    nombre: 'Martín Díaz',
    email: 'martin@example.com',
    telefono: null,
    rol: 'vecino',
    zonaId: null,
    avisosActivos: false,
    creadoEn: '2026-09-01T09:00:00-03:00',
  },
  {
    id: 'usr-086',
    nombre: 'Ana López',
    email: 'ana@example.com',
    telefono: null,
    rol: 'vecino',
    zonaId: null,
    avisosActivos: true,
    creadoEn: '2026-09-02T09:00:00-03:00',
  },
  ...zonasMock.map((zona, index): Usuario => ({
    id: `usr-00${index + 3}`,
    nombre: `Operador ${zona.nombre}`,
    email: `operador${index + 3}@example.com`,
    telefono: null,
    rol: 'operador',
    zonaId: zona.id,
    avisosActivos: true,
    creadoEn: '2026-08-01T08:00:00-03:00',
  })),
];

export const cuadrillasMock: Cuadrilla[] = [
  {
    id: 'cua-02',
    nombre: 'Cuadrilla 2 — Bacheo',
    zonaId: 'zon-norte',
    especialidad: 'pavimento',
    activa: true,
  },
  {
    id: 'cua-03',
    nombre: 'Cuadrilla 3 — Alumbrado',
    zonaId: 'zon-sur',
    especialidad: 'electricidad',
    activa: true,
  },
  {
    id: 'cua-04',
    nombre: 'Cuadrilla 4 — Limpieza',
    zonaId: 'zon-este',
    especialidad: 'limpieza',
    activa: true,
  },
  {
    id: 'cua-05',
    nombre: 'Cuadrilla 5 — Arbolado',
    zonaId: 'zon-oeste',
    especialidad: 'arbolado',
    activa: true,
  },
  {
    id: 'cua-06',
    nombre: 'Cuadrilla 6 — Mantenimiento',
    zonaId: 'zon-norte',
    especialidad: 'mantenimiento',
    activa: false,
  },
];
