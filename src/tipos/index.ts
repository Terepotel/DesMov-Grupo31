export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Foto {
  id: string;
  url: string;
  momento: 'problema' | 'arreglo';
}

export type EstadoReporte = 'recibido' | 'en_revision' | 'asignado' | 'resuelto' | 'rechazado';

export interface Reporte {
  id: string;
  codigo: string;
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  zonaId: string;
  estado: EstadoReporte;
  autorId: string;
  cuadrillaId: string | null;
  duplicadoDe: string | null;
  adhesiones: number;
  creadoEn: string;
  sincronizado: boolean;
}

export interface TipoDeReporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  areaResponsable: string;
}

export interface CambioDeEstado {
  id: string;
  reporteId: string;
  estado: EstadoReporte;
  comentario: string | null;
  operadorId: string | null;
  fechaHora: string;
}

export type Rol = 'vecino' | 'operador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  zonaId: string | null;
  avisosActivos: boolean;
  creadoEn: string;
}

export interface Zona {
  id: string;
  nombre: string;
  limite: Coordenadas[];
  referente: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  zonaId: string;
  especialidad: string;
  activa: boolean;
}

// Sobres de la API: una lista trae `meta`; una sola cosa viene con `meta: null`.
export interface Meta {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaLista<T> {
  datos: T[];
  meta: Meta;
}

export interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

export interface RespuestaError {
  error: { codigo: string; mensaje: string };
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}
