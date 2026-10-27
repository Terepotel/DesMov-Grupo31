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

/** «Nadie se sumó todavía», «1 vecino se sumó», «3 vecinos se sumaron». */
export function textoAdhesiones(cantidad: number) {
  if (cantidad === 0) return 'Nadie se sumó todavía';
  return cantidad === 1 ? '1 vecino se sumó' : `${cantidad} vecinos se sumaron`;
}
