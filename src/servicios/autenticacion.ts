// Sesión del usuario: ingreso y persistencia en el teléfono.
// El token va siempre en expo-secure-store (nunca en kv-store). El usuario se guarda al lado para
// poder abrir la app sin señal (NF1) y refrescarlo cuando vuelva la conexión.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { loginAccounts, usuariosMock } from '@/mocks';
import type { RespuestaUno, Sesion, Usuario } from '@/tipos';

import { ErrorApi, establecerToken, pedir, USAR_MOCKS } from './api';
import { responderUno, tokenMock, usuarioIdDeLaSesionMock } from './mock';

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
