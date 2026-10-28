// Qué le falta al reporte antes de mandarlo. La API valida lo mismo, pero acá se avisa junto a
// cada campo y sin gastar un envío (§8.2: prevenir antes de enviar).

import type { FotoElegida } from '@/servicios/fotos';
import type { Coordenadas } from '@/tipos';

/** Lo mismo que acepta la API para `descripcion` (DECISIONS P7). */
export const MAX_DESCRIPCION = 1000;

export interface CamposDelReporte {
  tipoId: string | null;
  fotos: FotoElegida[];
  coordenadas: Coordenadas | null;
  /** Sin punto, la calle escrita alcanza: las coordenadas se buscan al enviar (P3). */
  direccionEscrita: string;
  descripcion: string;
}

export type CampoDelReporte = 'tipo' | 'foto' | 'ubicacion' | 'descripcion';

export type ErroresDelReporte = Partial<Record<CampoDelReporte, string>>;

/** En el orden en que aparecen en la pantalla. */
export const CAMPOS: CampoDelReporte[] = ['tipo', 'foto', 'ubicacion', 'descripcion'];

export function validarReporte(campos: CamposDelReporte): ErroresDelReporte {
  const errores: ErroresDelReporte = {};
  if (!campos.tipoId) errores.tipo = 'Elegí qué tipo de problema es.';
  // Foto obligatoria, no se negocia (R1.2, NF3).
  if (campos.fotos.length === 0) {
    errores.foto = 'Sacale una foto al problema o elegí una de la galería.';
  }
  if (!campos.coordenadas && campos.direccionEscrita.trim() === '') {
    errores.ubicacion = 'Marcá en el mapa dónde está el problema o escribí la dirección.';
  }
  // Sin nota de voz todavía (R1.5), el texto es lo único que cuenta qué pasa: es obligatorio (P15).
  const descripcion = campos.descripcion.trim();
  if (descripcion === '') errores.descripcion = 'Contanos en pocas palabras qué pasa.';
  else if (descripcion.length > MAX_DESCRIPCION) {
    errores.descripcion = `Puede tener hasta ${MAX_DESCRIPCION} letras. Acortala un poco.`;
  }
  return errores;
}

/** «Revisá la foto y dónde está.» Para el aviso junto al botón de enviar. */
export function resumirErrores(errores: ErroresDelReporte) {
  const nombres: Record<CampoDelReporte, string> = {
    tipo: 'qué pasa',
    foto: 'la foto',
    ubicacion: 'dónde está',
    descripcion: 'la descripción',
  };
  const faltan = CAMPOS.filter((campo) => errores[campo]).map((campo) => nombres[campo]);
  if (faltan.length === 0) return null;
  const lista =
    faltan.length === 1 ? faltan[0] : `${faltan.slice(0, -1).join(', ')} y ${faltan.at(-1)}`;
  return `Revisá ${lista}.`;
}
