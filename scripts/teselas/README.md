# Teselas del mapa sin señal

Genera `assets/mapa/teselas-claro.zip`, `teselas-oscuro.zip` y `teselas.json`: el mapa de la planta
urbana de Gualeguaychú en imágenes WebP de 512 px, zoom 13 a 17, en tema claro y oscuro, que la app guarda en
el teléfono y muestra con la capa `LocalTile` de `react-native-maps` (consignas §8.1 P3). En Android el proveedor no dibuja nada
(`mapType="none"`): el mapa es siempre éste, con o sin señal, y por eso el zoom y el paneo quedan
acotados a lo que hay. En todos los zooms se cubre más que la ciudad, para que al llegar al borde la
pantalla entera siga con teselas: unos 4 km alrededor en 16 y 17, un anillo medio en 15 y uno ancho
en 13 y 14 (`cajaDelZoom` en `generar.mjs`).

Se corre **una vez** y el resultado va al repo. No hace falta volver a correrlo salvo que cambie la
caja, los zooms, el estilo o se quiera un mapa más nuevo. No pide APK nuevo: el zip viaja con el
JavaScript.

## Cómo correrlo

Requisitos: Node 20 o más nuevo, Docker andando y conexión a internet.

```bash
cd scripts/teselas
npm install
npm run generar            # unos minutos; deja todo lo intermedio en trabajo/
npm run generar -- --limpiar   # igual, pero borra los PNG sueltos al terminar
```

## Qué hace

1. **Recorta OpenStreetMap.** Baja de la build diaria de Protomaps sólo la caja más ancha (ciudad y
   alrededores, `CAJA_ALREDEDORES_LEJOS` en `generar.mjs`), por HTTP range.
2. **Arma los estilos.** `@protomaps/basemaps`, flavors `light` y `dark` (uno por tema de la app),
   rótulos en castellano y letra un 30 % más grande que la de base (NF5). Fuentes y sprites se
   leen de `protomaps.github.io`.
3. **Rasteriza.** Levanta `tileserver-gl` en Docker y pide cada tesela WebP a 2x (512 px), por
   tema. Pesa la mitad que un PNG de 256 px y se ve nítida en pantallas densas.
4. **Empaqueta.** Un zip por tema sin compresión (las imágenes ya vienen comprimidas) con la
   estructura `{z}/{x}/{y}.webp`, y un `teselas.json` con la versión (fecha de la build), la caja y la cantidad.

Ajustes: `PROTOMAPS_BUILD=AAAAMMDD` elige otra build; `PUERTO` cambia el del tileserver.

## Licencia

Los datos son de OpenStreetMap, licencia ODbL: la app muestra «© OpenStreetMap» sobre el mapa
(`MapaBase`) y hay que mantenerlo.

## Lado de la app

- `src/modulos/mapa/teselas-locales.ts` descomprime el zip del tema en uso la primera vez que se
  abre un mapa con ese tema (`expo-asset` + `fflate` + `expo-file-system`) en
  `<documentos>/teselas/<versión>/<tema>/` y borra las versiones anteriores. Nunca lanza: sin
  teselas, el mapa sigue con el proveedor.
- `MapaBase` agrega `<LocalTile>` del tema del sistema cuando están listas, y la atribución.
