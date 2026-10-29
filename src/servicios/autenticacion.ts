// Sesión del usuario: ingreso y persistencia en el teléfono.
// El token va siempre en expo-secure-store (nunca en kv-store). El usuario se guarda al lado para
// poder abrir la app sin señal (NF1) y refrescarlo cuando vuelva la conexión.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { loginAccounts, usuariosMock } from '@/mocks';
import type { RespuestaUno, Sesion, Usuario } from '@/tipos';

import { ErrorApi, establecerToken, pedir, USAR_MOCKS } from './api';
import {
  ahoraMock,
  responderUno,
  tokenMock,
  usuarioIdDeLaSesionMock,
  verificarEscenario,
} from './mock';

const CLAVE_TOKEN = 'sesion.token';
const CLAVE_USUARIO = 'sesion.usuario';

// En web no hay SecureStore: sólo para probar en el navegador durante el desarrollo.
const almacen = {
  leer: (clave: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(clave) ?? null)
      : SecureStore.getItemAsync(clave),
  escribir: (clave: string, valor: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.setItem(clave, valor))
      : SecureStore.setItemAsync(clave, valor),
  borrar: (clave: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.removeItem(clave))
      : SecureStore.deleteItemAsync(clave),
};

export async function iniciarSesion(email: string, contrasena: string): Promise<Usuario> {
  const sesion = USAR_MOCKS
    ? await iniciarSesionMock(email, contrasena)
    : (
        await pedir<RespuestaUno<Sesion>>('/auth/ingreso', {
          metodo: 'POST',
          cuerpo: { email, contrasena },
        })
      ).datos;
  return guardarSesion(sesion);
}

/** Lo que pide `POST /auth/registro` (P14). La API siempre crea un vecino. */
export interface Registro {
  nombre: string;
  email: string;
  contrasena: string;
  telefono: string | null;
}

/** La API exige al menos esto (`VALIDACION_FALLIDA` si no); se revisa antes en el formulario. */
export const LARGO_MINIMO_CONTRASENA = 8;

/** Crea la cuenta del vecino y deja la sesión iniciada, como el ingreso. */
export async function registrarse(registro: Registro): Promise<Usuario> {
  const sesion = USAR_MOCKS
    ? await registrarseMock(registro)
    : (await pedir<RespuestaUno<Sesion>>('/auth/registro', { metodo: 'POST', cuerpo: registro }))
        .datos;
  return guardarSesion(sesion);
}

async function guardarSesion(sesion: Sesion): Promise<Usuario> {
  establecerToken(sesion.token);
  await Promise.all([
    almacen.escribir(CLAVE_TOKEN, sesion.token),
    almacen.escribir(CLAVE_USUARIO, JSON.stringify(sesion.usuario)),
  ]);
  return sesion.usuario;
}

export async function obtenerUsuarioActual(): Promise<Usuario> {
  const usuario = USAR_MOCKS
    ? await responderUno(
        usuariosMock.find((u) => u.id === usuarioIdDeLaSesionMock()),
        new ErrorApi('NO_AUTENTICADO', 'Tenés que ingresar con tu cuenta.', 401),
      )
    : (await pedir<RespuestaUno<Usuario>>('/yo')).datos;

  await almacen.escribir(CLAVE_USUARIO, JSON.stringify(usuario));
  return usuario;
}

/** La sesión guardada en el teléfono, o `null` si nunca ingresó o cerró sesión. */
export async function leerSesionGuardada(): Promise<Sesion | null> {
  const [token, usuario] = await Promise.all([
    almacen.leer(CLAVE_TOKEN),
    almacen.leer(CLAVE_USUARIO),
  ]);
  if (!token || !usuario) return null;
  establecerToken(token);
  return { token, usuario: JSON.parse(usuario) as Usuario };
}

export async function cerrarSesion() {
  establecerToken(null);
  await Promise.all([almacen.borrar(CLAVE_TOKEN), almacen.borrar(CLAVE_USUARIO)]);
}

async function iniciarSesionMock(email: string, contrasena: string): Promise<Sesion> {
  const cuenta = loginAccounts.find((c) => c.email === email && c.password === contrasena);
  const usuario = await responderUno(
    cuenta?.usuario,
    new ErrorApi('CREDENCIALES_INVALIDAS', 'El email o la contraseña no son correctos.', 401),
  );
  return { token: tokenMock(usuario.id), usuario };
}

// Como la API: el email es único sin distinguir mayúsculas (EMAIL_YA_REGISTRADO), y la cuenta nueva
// sirve para ingresar de nuevo mientras la app esté abierta.
async function registrarseMock(registro: Registro): Promise<Sesion> {
  verificarEscenario();
  const email = registro.email.trim().toLowerCase();
  if (usuariosMock.some((u) => u.email.toLowerCase() === email)) {
    throw new ErrorApi('EMAIL_YA_REGISTRADO', 'Ya hay una cuenta con ese email.', 409);
  }
  const usuario: Usuario = {
    id: `usr-${String(usuariosMock.length + 1).padStart(3, '0')}`,
    nombre: registro.nombre.trim(),
    email,
    telefono: registro.telefono,
    rol: 'vecino',
    zonaId: null,
    avisosActivos: true,
    creadoEn: ahoraMock(),
  };
  usuariosMock.push(usuario);
  loginAccounts.push({ email, password: registro.contrasena, usuario });
  return { token: tokenMock(usuario.id), usuario };
}
