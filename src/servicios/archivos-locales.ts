// Fotos y notas de voz del reporte, mientras no se suben. La cámara, la galería y el grabador las
// dejan en la caché, que el sistema puede vaciar: se pasan a `<documentos>/<carpeta>/` para que
// sigan ahí hasta que se suben (y, con la cola, aunque no haya señal).

import { Directory, File, Paths } from 'expo-file-system';

/** Mueve el archivo y devuelve su ruta nueva. Lanza si no se puede guardar. */
export function guardarEnDocumentos(uri: string, carpeta: string, extensionPorDefecto: string) {
  const destino = new Directory(Paths.document, carpeta);
  destino.create({ idempotent: true, intermediates: true });
  const archivo = new File(uri);
  const extension = archivo.extension || extensionPorDefecto;
  const nuevo = new File(
    destino,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`,
  );
  archivo.moveSync(nuevo);
  return nuevo.uri;
}

/** Para retomar un borrador: si el archivo ya no está, no se ofrece. */
export function existeArchivoLocal(uri: string) {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/** Cuando ya no hace falta: se reemplazó, se descartó el reporte o ya se subió. */
export function borrarArchivoLocal(uri: string) {
  try {
    const archivo = new File(uri);
    if (archivo.exists) archivo.delete();
  } catch {
    // Si no se puede borrar, queda en la carpeta de la app: no le cambia nada al vecino.
  }
}
