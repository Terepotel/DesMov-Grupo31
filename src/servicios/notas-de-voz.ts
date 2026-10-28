// La nota de voz del reporte (R1.5, P15): permiso del micrófono y dónde se guarda. Grabar y
// escuchar lo hacen los hooks de expo-audio en la pantalla, porque viven con el componente.

import { requestRecordingPermissionsAsync } from 'expo-audio';

import { borrarArchivoLocal, guardarEnDocumentos } from './archivos-locales';

export interface NotaDeVoz {
  /** Ruta local del archivo (m4a), hasta que se sube con `POST /archivos`. */
  uri: string;
}

/** Se corta sola a los 60 segundos (P15). */
export const MAX_SEGUNDOS_NOTA = 60;

export type ResultadoMicrofono =
  | { estado: 'ok' }
  /** `puedePreguntar: false` si lo negó para siempre: sólo queda la configuración. */
  | { estado: 'sin_permiso'; puedePreguntar: boolean }
  | { estado: 'no_disponible' };

export async function pedirPermisoDeMicrofono(): Promise<ResultadoMicrofono> {
  try {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) return { estado: 'sin_permiso', puedePreguntar: permiso.canAskAgain };
    return { estado: 'ok' };
  } catch {
    return { estado: 'no_disponible' };
  }
}

/** Pasa la grabación de la caché a `<documentos>/notas/`. Lanza si no se puede guardar. */
export function guardarNotaDeVoz(uri: string): NotaDeVoz {
  return { uri: guardarEnDocumentos(uri, 'notas', '.m4a') };
}

export function borrarNotaDeVoz(nota: NotaDeVoz) {
  borrarArchivoLocal(nota.uri);
}
