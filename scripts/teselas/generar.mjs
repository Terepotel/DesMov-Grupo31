#!/usr/bin/env node
/**
 * Genera las teselas del mapa sin señal (consignas §8.1 P3).
 *
 * Pasos:
 *   1. Recorta de la build diaria de Protomaps (OpenStreetMap, licencia ODbL) sólo la caja de la
 *      planta urbana de Gualeguaychú → `trabajo/gchu.pmtiles` (unos pocos MB, por HTTP range).
 *   2. Arma un estilo MapLibre por tema con `@protomaps/basemaps` (flavors claro y oscuro,
 *      rótulos en castellano y letra más grande, NF5) → `trabajo/styles/<tema>.json`.
 *   3. Levanta `tileserver-gl` en Docker para rasterizar y pide cada tesela WebP 2x de la caja,
 *      zoom `ZOOM_MIN` a `ZOOM_MAX`, una vez por tema → `trabajo/teselas/<tema>/{z}/{x}/{y}.webp`.
 *   4. Empaqueta cada tema sin comprimir (las imágenes ya vienen comprimidas) en
 *      `assets/mapa/teselas-<tema>.zip` y deja `assets/mapa/teselas.json` con la versión y la caja.
 *
 * Requisitos: Node 20+, Docker andando y red. Se corre una vez; el resultado va al repo.
 *   cd scripts/teselas && npm install && npm run generar
 *
 * Variables opcionales: PROTOMAPS_BUILD (fecha AAAAMMDD de la build), PUERTO (del tileserver).
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { layers, namedFlavor } from '@protomaps/basemaps';
import { zipSync } from 'fflate';

// ---------- Configuración ----------

/** Planta urbana de Gualeguaychú: la misma caja que `REGION_CIUDAD` con un margen. */
const CAJA = { oeste: -58.56, sur: -33.05, este: -58.47, norte: -32.97 };
/**
 * Qué se cubre en cada zoom. Siempre más que la ciudad, para que al llegar al borde de la planta
 * urbana la pantalla entera siga teniendo teselas (la app acota el paneo a estas cajas, ver
 * `MapaBase`). Cada zoom cuadruplica la cantidad de teselas, por eso los anillos se achican al
 * acercar: unos 4 km alrededor en 16 y 17, un anillo medio en 15 y uno ancho en 13 y 14.
 */
const CAJA_ALREDEDORES_CERCA = { oeste: -58.6, sur: -33.08, este: -58.43, norte: -32.94 };
const CAJA_ALREDEDORES_MEDIO = { oeste: -58.72, sur: -33.2, este: -58.32, norte: -32.82 };
const CAJA_ALREDEDORES_LEJOS = { oeste: -58.82, sur: -33.31, este: -58.22, norte: -32.71 };
const ZOOM_MIN = 13;
const ZOOM_MAX = 17;
function cajaDelZoom(z) {
  if (z <= 14) return CAJA_ALREDEDORES_LEJOS;
  if (z === 15) return CAJA_ALREDEDORES_MEDIO;
  return CAJA_ALREDEDORES_CERCA;
}
/** Teselas de 512 px (2x) en WebP: nítidas en pantallas densas y la mitad del peso de un PNG. */
const TAMANIO = 512;
const FORMATO = 'webp';
/** Cuánto se agranda la letra respecto del estilo base (NF5: letra grande). */
const ESCALA_TEXTO = 1.3;
const FECHA_BUILD = process.env.PROTOMAPS_BUILD ?? '20261026';
const PUERTO = Number(process.env.PUERTO ?? 8765);
const CONCURRENCIA = 8;

const ORIGEN_PMTILES = `https://build.protomaps.com/${FECHA_BUILD}.pmtiles`;
const URL_GLIFOS = 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf';
const URL_SPRITES = 'https://protomaps.github.io/basemaps-assets/sprites/v4/{flavor}';
/** Un juego de teselas por tema de la app, con el flavor de Protomaps que le corresponde. */
const TEMAS = { claro: 'light', oscuro: 'dark' };

const AQUI = dirname(fileURLToPath(import.meta.url));
const TRABAJO = join(AQUI, 'trabajo');
const SALIDA = resolve(AQUI, '..', '..', 'assets', 'mapa');
const DIR_TESELAS = join(TRABAJO, 'teselas');

// ---------- Utilidades ----------

function paso(texto) {
  console.log(`\n== ${texto}`);
}

function docker(args, opciones = {}) {
  const r = spawnSync('docker', args, { stdio: 'inherit', ...opciones });
  if (r.status !== 0) throw new Error(`docker ${args[0]} falló (código ${r.status})`);
}

/** Número de tesela (x, y) que contiene un punto, en un zoom dado. */
function teselaDe(longitud, latitud, zoom) {
  const n = 2 ** zoom;
  const x = Math.floor(((longitud + 180) / 360) * n);
  const rad = (latitud * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x, y };
}

function* teselasDeLaCaja() {
  for (let z = ZOOM_MIN; z <= ZOOM_MAX; z++) {
    const caja = cajaDelZoom(z);
    const a = teselaDe(caja.oeste, caja.norte, z);
    const b = teselaDe(caja.este, caja.sur, z);
    for (let x = a.x; x <= b.x; x++) for (let y = a.y; y <= b.y; y++) yield { z, x, y };
  }
}

/** Multiplica los tamaños de letra del estilo, respetando las expresiones de zoom de MapLibre. */
function escalarTamanio(valor) {
  if (typeof valor === 'number') return valor * ESCALA_TEXTO;
  if (!Array.isArray(valor)) return valor;
  const [op, ...resto] = valor;
  if (op === 'interpolate') {
    // ["interpolate", tipo, entrada, parada, salida, parada, salida, ...]
    return [op, resto[0], resto[1], ...resto.slice(2).map((v, i) => (i % 2 ? escalarTamanio(v) : v))];
  }
  if (op === 'step') {
    // ["step", entrada, salidaInicial, parada, salida, ...]
    return [op, resto[0], escalarTamanio(resto[1]), ...resto.slice(2).map((v, i) => (i % 2 ? escalarTamanio(v) : v))];
  }
  if (op === 'case' || op === 'match' || op === 'coalesce') {
    return [op, ...resto.map((v) => (typeof v === 'number' ? escalarTamanio(v) : v))];
  }
  return valor;
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Pasos ----------

function recortarPmtiles() {
  paso(`Recortando ${ORIGEN_PMTILES} a la caja más ancha (ciudad y alrededores)`);
  const destino = join(TRABAJO, 'gchu.pmtiles');
  try {
    if (statSync(destino).size > 0) return console.log('Ya estaba, se reusa.');
  } catch {}
  docker([
    'run', '--rm', '-v', `${TRABAJO}:/data`, 'protomaps/go-pmtiles',
    'extract', ORIGEN_PMTILES, '/data/gchu.pmtiles',
    // La más ancha de todas: si se recorta sólo la ciudad, los alrededores salen vacíos.
    `--bbox=${CAJA_ALREDEDORES_LEJOS.oeste},${CAJA_ALREDEDORES_LEJOS.sur},${CAJA_ALREDEDORES_LEJOS.este},${CAJA_ALREDEDORES_LEJOS.norte}`,
  ]);
}

function armarEstilos() {
  paso('Armando los estilos (claro y oscuro, castellano, letra grande)');
  mkdirSync(join(TRABAJO, 'styles'), { recursive: true });
  mkdirSync(join(TRABAJO, 'fonts'), { recursive: true });
  const styles = {};
  for (const [tema, flavor] of Object.entries(TEMAS)) {
    const capas = layers('protomaps', namedFlavor(flavor), { lang: 'es' }).map((capa) => {
      if (capa.type !== 'symbol' || !capa.layout?.['text-size']) return capa;
      return { ...capa, layout: { ...capa.layout, 'text-size': escalarTamanio(capa.layout['text-size']) } };
    });
    const estilo = {
      version: 8,
      name: `Gualeguaychú sin señal (${tema})`,
      sources: { protomaps: { type: 'vector', url: 'pmtiles://gchu' } },
      glyphs: URL_GLIFOS,
      sprite: URL_SPRITES.replace('{flavor}', flavor),
      layers: capas,
    };
    writeFileSync(join(TRABAJO, 'styles', `${tema}.json`), JSON.stringify(estilo));
    styles[tema] = { style: `${tema}.json`, serve_rendered: true, serve_data: false };
  }
  writeFileSync(
    join(TRABAJO, 'config.json'),
    JSON.stringify({
      options: { paths: { root: '/data', fonts: 'fonts', styles: 'styles', mbtiles: '', pmtiles: '' } },
      styles,
      data: { gchu: { pmtiles: 'gchu.pmtiles' } },
    }),
  );
}

async function levantarTileserver() {
  paso('Levantando tileserver-gl');
  docker(['rm', '-f', 'teselas-gchu'], { stdio: 'ignore' });
  const proceso = spawn(
    'docker',
    [
      'run', '--rm', '--name', 'teselas-gchu', '-p', `${PUERTO}:8080`,
      '-v', `${TRABAJO}:/data`, 'maptiler/tileserver-gl', '--config', '/data/config.json',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  for (let i = 0; i < 60; i++) {
    await esperar(1000);
    try {
      const r = await fetch(`http://localhost:${PUERTO}/health`);
      if (r.ok) return proceso;
    } catch {}
  }
  throw new Error('tileserver-gl no respondió en 60 s');
}

async function pedirTesela(tema, { z, x, y }) {
  const archivo = join(DIR_TESELAS, tema, String(z), String(x), `${y}.${FORMATO}`);
  try {
    if (statSync(archivo).size > 0) return 'reusada';
  } catch {}
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(
        `http://localhost:${PUERTO}/styles/${tema}/256/${z}/${x}/${y}@${TAMANIO / 256}x.${FORMATO}`,
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      mkdirSync(dirname(archivo), { recursive: true });
      writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
      return 'nueva';
    } catch (e) {
      if (intento >= 4) throw new Error(`${tema} ${z}/${x}/${y}: ${e.message}`);
      await esperar(500 * intento);
    }
  }
}

async function rasterizar(tema) {
  const todas = [...teselasDeLaCaja()];
  paso(`Rasterizando ${todas.length} teselas del tema ${tema} (zoom ${ZOOM_MIN} a ${ZOOM_MAX})`);
  let hechas = 0;
  const cola = todas[Symbol.iterator]();
  await Promise.all(
    Array.from({ length: CONCURRENCIA }, async () => {
      for (const t of cola) {
        await pedirTesela(tema, t);
        hechas++;
        if (hechas % 100 === 0) process.stdout.write(`  ${hechas}/${todas.length}\n`);
      }
    }),
  );
  return todas.length;
}

function empaquetar(tema) {
  paso(`Empaquetando assets/mapa/teselas-${tema}.zip`);
  const dir = join(DIR_TESELAS, tema);
  const entradas = {};
  let cantidad = 0;
  for (const z of readdirSync(dir))
    for (const x of readdirSync(join(dir, z)))
      for (const y of readdirSync(join(dir, z, x))) {
        entradas[`${z}/${x}/${y}`] = [readFileSync(join(dir, z, x, y)), { level: 0 }];
        cantidad++;
      }
  mkdirSync(SALIDA, { recursive: true });
  const zip = zipSync(entradas);
  writeFileSync(join(SALIDA, `teselas-${tema}.zip`), zip);
  console.log(`${tema}: ${cantidad} teselas, zip de ${(zip.length / 1e6).toFixed(1)} MB`);
  return cantidad;
}

function escribirManifiesto(cantidad) {
  const manifiesto = {
    version: FECHA_BUILD,
    fuente: 'OpenStreetMap (ODbL) vía Protomaps',
    temas: Object.keys(TEMAS),
    fondo: Object.fromEntries(Object.entries(TEMAS).map(([t, f]) => [t, namedFlavor(f).earth])),
    caja: CAJA,
    cajaPorZoom: Object.fromEntries(
      Array.from({ length: ZOOM_MAX - ZOOM_MIN + 1 }, (_, i) => [ZOOM_MIN + i, cajaDelZoom(ZOOM_MIN + i)]),
    ),
    zoomMin: ZOOM_MIN,
    zoomMax: ZOOM_MAX,
    tamanioTesela: TAMANIO,
    formato: FORMATO,
    cantidadPorTema: cantidad,
  };
  writeFileSync(join(SALIDA, 'teselas.json'), JSON.stringify(manifiesto, null, 2) + '\n');
}

// ---------- Main ----------

mkdirSync(TRABAJO, { recursive: true });
let tileserver;
try {
  recortarPmtiles();
  armarEstilos();
  tileserver = await levantarTileserver();
  let cantidad = 0;
  for (const tema of Object.keys(TEMAS)) {
    await rasterizar(tema);
    cantidad = empaquetar(tema);
  }
  escribirManifiesto(cantidad);
} finally {
  if (tileserver) docker(['rm', '-f', 'teselas-gchu'], { stdio: 'ignore' });
  if (process.argv.includes('--limpiar')) rmSync(DIR_TESELAS, { recursive: true, force: true });
}
