import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { unzipSync } from 'fflate';
import { useEffect, useState } from 'react';

import manifiesto from '@/assets/mapa/teselas.json';

/**
 * Teselas del mapa sin señal (consignas §8.1 P3). Vienen empaquetadas en
 * `assets/mapa/teselas-<tema>.zip` (las genera `scripts/teselas/`, a partir de OpenStreetMap), un
 * zip por tema de la app (claro y oscuro, para que la capa no desentone con el mapa del proveedor).
 * La primera vez que se abre un mapa con un tema se descomprime el zip de ese tema en la carpeta
 * de documentos de la app; después se lee de ahí. Cada versión va en su propia carpeta y las
 * anteriores se borran.
 *
 * Nunca lanza: si algo falla, el mapa sigue sin la capa (con señal se ve el del proveedor).
 */

export type TemaTeselas = 'claro' | 'oscuro';

/** Los `require` tienen que ser literales para que Metro empaquete los zips. */
const ZIPS: Record<TemaTeselas, number> = {
  claro: require('@/assets/mapa/teselas-claro.zip'),
  oscuro: require('@/assets/mapa/teselas-oscuro.zip'),
};

/** Dónde quedan guardadas: `<documentos>/teselas/<versión>/<tema>/{z}/{x}/{y}.webp`. */
const CARPETA_RAIZ = 'teselas';
/** Guarda el manifiesto con el que se descomprimió: si cambia (formato, caja…), se vuelve a hacer. */
const ARCHIVO_LISTO = 'listo.json';
const FIRMA = JSON.stringify(manifiesto);

const preparaciones: Partial<Record<TemaTeselas, Promise<string | null>>> = {};

/**
 * Deja las teselas de un tema en el teléfono y devuelve la plantilla de ruta para `LocalTile`
 * (`/data/.../teselas/20261026/claro/{z}/{x}/{y}.webp`), o `null` si no se pudieron preparar.
 * Varias llamadas a la vez comparten el mismo trabajo.
 */
export function prepararTeselasLocales(tema: TemaTeselas): Promise<string | null> {
  preparaciones[tema] ??= preparar(tema).catch((error) => {
    console.warn(`No se pudieron preparar las teselas del mapa sin señal (${tema})`, error);
    delete preparaciones[tema];
    return null;
  });
  return preparaciones[tema];
}

/** La plantilla de ruta cuando las teselas del tema están listas; `null` mientras tanto o si fallaron. */
export function useTeselasLocales(tema: TemaTeselas) {
  const [plantilla, setPlantilla] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    prepararTeselasLocales(tema).then((resultado) => {
      if (vigente) setPlantilla(resultado);
    });
    return () => {
      vigente = false;
    };
  }, [tema]);

  return plantilla;
}

async function preparar(tema: TemaTeselas) {
  const raiz = new Directory(Paths.document, CARPETA_RAIZ);
  const carpeta = new Directory(raiz, manifiesto.version, tema);
  const listo = new File(carpeta, ARCHIVO_LISTO);

  if (!listo.exists || (await listo.text()) !== FIRMA) {
    borrarVersionesViejas(raiz);
    if (carpeta.exists) carpeta.delete();
    await descomprimirEn(carpeta, ZIPS[tema]);
    listo.create({ overwrite: true });
    listo.write(FIRMA);
  }

  const plantilla = `${rutaDelSistema(carpeta.uri)}/{z}/{x}/{y}.${manifiesto.formato}`;
  if (__DEV__) console.log(`Teselas del mapa (${tema}): ${plantilla}`);
  return plantilla;
}

function borrarVersionesViejas(raiz: Directory) {
  if (!raiz.exists) return;
  for (const hijo of raiz.list()) {
    if (hijo.name !== manifiesto.version) hijo.delete();
  }
}

async function descomprimirEn(carpeta: Directory, zip: number) {
  const [recurso] = await Asset.loadAsync(zip);
  if (!recurso.localUri) throw new Error('El zip de teselas no tiene ruta local');

  const entradas = unzipSync(await new File(recurso.localUri).bytes());
  carpeta.create({ intermediates: true, idempotent: true });

  const carpetasCreadas = new Set<string>();
  for (const [ruta, datos] of Object.entries(entradas)) {
    if (ruta.endsWith('/')) continue; // entradas de carpeta del zip
    const subcarpeta = ruta.slice(0, ruta.lastIndexOf('/'));
    if (!carpetasCreadas.has(subcarpeta)) {
      new Directory(carpeta, subcarpeta).create({ intermediates: true, idempotent: true });
      carpetasCreadas.add(subcarpeta);
    }
    const archivo = new File(carpeta, ruta);
    archivo.create({ overwrite: true });
    archivo.write(datos);
  }
}

/** `LocalTile` abre el archivo directo (sin `file://`), en Android y en iOS. */
function rutaDelSistema(uri: string) {
  return decodeURI(uri.replace(/^file:\/\//, '')).replace(/\/$/, '');
}
