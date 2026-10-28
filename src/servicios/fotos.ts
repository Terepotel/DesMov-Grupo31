// La foto del problema: permiso, galería y dónde se guarda. El permiso de cámara es la condición
// para reportar, aunque la foto se elija de la galería (NF3, consignas P1).

import * as ImagePicker from 'expo-image-picker';

import { borrarArchivoLocal, guardarEnDocumentos } from './archivos-locales';

export interface FotoElegida {
  /** Ruta local del archivo, hasta que se sube con `POST /archivos`. */
  uri: string;
}

export type ResultadoFoto =
  | { estado: 'ok'; foto: FotoElegida }
  /** El vecino cerró la galería sin elegir. */
  | { estado: 'cancelado' }
  /** No hay permiso de cámara. `puedePreguntar: false` si lo negó para siempre: sólo queda la configuración. */
  | { estado: 'sin_permiso'; puedePreguntar: boolean }
  | { estado: 'no_disponible' };

export type ResultadoPermiso =
  Exclude<ResultadoFoto, { estado: 'ok' | 'cancelado' }> | { estado: 'ok' };

/** Fotos del problema por reporte (P16): la API rechaza la tercera (R1). */
export const MAX_FOTOS_DEL_PROBLEMA = 2;

// La API acepta fotos de hasta 5 MB: con 0.7 una foto de celular queda muy por debajo.
export const CALIDAD_FOTO = 0.7;

/** Pide el permiso de cámara (o confirma que ya está). Sin él no hay reporte (NF3). */
export async function pedirPermisoDeCamara(): Promise<ResultadoPermiso> {
  try {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return { estado: 'sin_permiso', puedePreguntar: permiso.canAskAgain };
    return { estado: 'ok' };
  } catch {
    return { estado: 'no_disponible' };
  }
}

/** Abre la galería, para una foto sacada antes (R1.3, P1). La foto queda guardada en la app. */
export async function elegirFotoDeLaGaleria(): Promise<ResultadoFoto> {
  const permiso = await pedirPermisoDeCamara();
  if (permiso.estado !== 'ok') return permiso;
  try {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: CALIDAD_FOTO,
    });
    const asset = resultado.canceled ? undefined : resultado.assets[0];
    if (!asset) return { estado: 'cancelado' };
    return { estado: 'ok', foto: guardarFoto(asset.uri) };
  } catch {
    return { estado: 'no_disponible' };
  }
}

/** Pasa la foto de la caché a `<documentos>/fotos/`. Lanza si no se puede guardar. */
export function guardarFoto(uri: string): FotoElegida {
  return { uri: guardarEnDocumentos(uri, 'fotos', '.jpg') };
}

export function borrarFoto(foto: FotoElegida) {
  borrarArchivoLocal(foto.uri);
}
