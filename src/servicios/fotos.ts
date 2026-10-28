// La foto del problema (expo-image-picker). Nunca lanza: devuelve un resultado con `estado` para que
// la pantalla diga qué pasó y qué hacer. El permiso de cámara es la condición para reportar, aunque
// la foto se elija de la galería (NF3, consignas P1).

import * as ImagePicker from 'expo-image-picker';

export interface FotoElegida {
  /** Ruta local del archivo, hasta que se sube con `POST /archivos`. */
  uri: string;
}

export type ResultadoFoto =
  | { estado: 'ok'; foto: FotoElegida }
  /** El vecino cerró la cámara o la galería sin elegir. */
  | { estado: 'cancelado' }
  /** No hay permiso de cámara. `puedePreguntar: false` si lo negó para siempre: sólo queda la configuración. */
  | { estado: 'sin_permiso'; puedePreguntar: boolean }
  | { estado: 'no_disponible' };

// La API acepta fotos de hasta 5 MB: con 0.7 una foto de celular queda muy por debajo.
const OPCIONES: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

async function conPermisoDeCamara(
  abrir: () => Promise<ImagePicker.ImagePickerResult>,
): Promise<ResultadoFoto> {
  try {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return { estado: 'sin_permiso', puedePreguntar: permiso.canAskAgain };

    const resultado = await abrir();
    const asset = resultado.canceled ? undefined : resultado.assets[0];
    if (!asset) return { estado: 'cancelado' };
    return { estado: 'ok', foto: { uri: asset.uri } };
  } catch {
    return { estado: 'no_disponible' };
  }
}

/** Abre la cámara (R1.2). */
export function sacarFoto() {
  return conPermisoDeCamara(() => ImagePicker.launchCameraAsync(OPCIONES));
}

/** Abre la galería, para una foto sacada antes (R1.3, P1). */
export function elegirFotoDeLaGaleria() {
  return conPermisoDeCamara(() => ImagePicker.launchImageLibraryAsync(OPCIONES));
}
