import { loginAccounts } from '../mocks';
import type { RespuestaApi, Usuario } from '../tipos';

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<RespuestaApi<Usuario>> {
  const cuenta = loginAccounts.find(
    (account) => account.email === email && account.password === password,
  );

  if (!cuenta) {
    return {
      error: {
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Email o contraseña incorrectos.',
      },
    };
  }

  return {
    datos: [{ ...cuenta.usuario }],
    meta: { total: 1, pagina: 1, porPagina: 1 },
  };
}
