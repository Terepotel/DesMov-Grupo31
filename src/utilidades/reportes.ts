// Ayudas puras sobre reportes, sin pantalla ni servicios.

// El esquema es el `expo.scheme` de `app.json`.
const ESQUEMA = 'desmovgrupo31';

/** `GCHU-2026-00412`, sin importar mayúsculas: lo que lee un QR o escribe una persona. */
export function esCodigoDeSeguimiento(texto: string) {
  return /^GCHU-\d{4}-\d{5}$/i.test(texto.trim());
}

/**
 * Lo que va en el QR del mostrador (P17): `desmovgrupo31://reporte/GCHU-2026-00412`. Se arma a
 * mano y no con `Linking.createURL`, que en Expo Go y en desarrollo da otra forma (`exp://…/--/…`):
 * un QR impreso tiene que abrir igual en cualquier build. La ruta `reporte/[id]` acepta el código.
 */
export function enlaceDelReporte(codigo: string) {
  return `${ESQUEMA}://reporte/${codigo}`;
}

/**
 * Id que pone el teléfono (`rep-k3x9a1b2c3d4`): con el mismo id, la API no duplica el reporte si se
 * reintenta el envío (idempotencia de `POST /reportes`). Mismo formato que los del servidor.
 */
export function nuevoId(prefijo: 'rep' | 'fot') {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let texto = '';
  for (let i = 0; i < 12; i++) texto += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `${prefijo}-${texto}`;
}

/** «Nadie se sumó todavía», «1 vecino se sumó», «3 vecinos se sumaron». */
export function textoAdhesiones(cantidad: number) {
  if (cantidad === 0) return 'Nadie se sumó todavía';
  return cantidad === 1 ? '1 vecino se sumó' : `${cantidad} vecinos se sumaron`;
}
