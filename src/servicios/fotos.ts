// La foto del problema: permiso, galería y dónde se guarda. El permiso de cámara es la condición
// para reportar, aunque la foto se elija de la galería (NF3, consignas P1).

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

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

/**
 * La cámara y la galería dejan la foto en la caché, que el sistema puede vaciar. Se pasa a
 * `<documentos>/fotos/` para que siga ahí hasta que se sube (y, con la cola, aunque no haya señal).
 * Lanza si no se puede guardar.
 */
export function guardarFoto(uri: string): FotoElegida {
  const carpeta = new Directory(Paths.document, 'fotos');
  carpeta.create({ idempotent: true, intermediates: true });
  const archivo = new File(uri);
  const extension = archivo.extension || '.jpg';
  const destino = new File(
    carpeta,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`,
  );
  archivo.moveSync(destino);
  return { uri: destino.uri };
}

/** Cuando la foto ya no hace falta: se reemplazó, se descartó el reporte o ya se subió. */
export function borrarFoto(foto: FotoElegida) {
  try {
    const archivo = new File(foto.uri);
    if (archivo.exists) archivo.delete();
  } catch {
    // Si no se puede borrar, queda en la carpeta de la app: no le cambia nada al vecino.
  }
}
