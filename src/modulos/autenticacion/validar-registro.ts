import { LARGO_MINIMO_CONTRASENA, type Registro } from '@/servicios/autenticacion';

export type ErroresDeRegistro = Partial<Record<keyof Registro, string>>;

/** Lo que escribió el vecino, antes de limpiar. */
export type FormularioDeRegistro = Record<keyof Registro, string>;

/**
 * Lo mismo que exige la API (`VALIDACION_FALLIDA`), revisado antes de mandar para mostrarlo junto
 * a cada campo. Devuelve los errores y, si no hay, el registro limpio.
 */
export function validarRegistro(
  formulario: FormularioDeRegistro,
): { errores: ErroresDeRegistro; registro: null } | { errores: null; registro: Registro } {
  const errores: ErroresDeRegistro = {};
  const nombre = formulario.nombre.replace(/\s+/g, ' ').trim();
  const email = formulario.email.trim().toLowerCase();
  const telefono = formulario.telefono.trim();

  if (!nombre) errores.nombre = 'Escribí tu nombre.';
  else if (nombre.length > 120) errores.nombre = 'El nombre es demasiado largo.';
  if (!email) errores.email = 'Escribí tu email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = 'Revisá el email: no parece una dirección válida.';
  }
  if (!formulario.contrasena) errores.contrasena = 'Elegí una contraseña.';
  else if (formulario.contrasena.length < LARGO_MINIMO_CONTRASENA) {
    errores.contrasena = `La contraseña tiene que tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  if (telefono.length > 40) errores.telefono = 'El teléfono es demasiado largo.';

  if (Object.keys(errores).length > 0) return { errores, registro: null };
  return {
    errores: null,
    registro: { nombre, email, contrasena: formulario.contrasena, telefono: telefono || null },
  };
}
