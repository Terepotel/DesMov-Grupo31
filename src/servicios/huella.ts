// La huella (o la cara) del teléfono para volver a entrar sin escribir la contraseña (R4.7).
// Envuelve expo-local-authentication y nunca lanza: si algo falla, se cae a la contraseña.

import * as Autenticacion from 'expo-local-authentication';

export type ResultadoHuella =
  | { estado: 'ok' }
  /** Cerró el cuadro del sistema o tocó «Usar la contraseña». */
  | { estado: 'cancelado' }
  /** No coincidió, o el sistema bloqueó la huella por demasiados intentos. */
  | { estado: 'fallo'; mensaje: string }
  /** Sin huella en el teléfono: sólo queda la contraseña. */
  | { estado: 'no_disponible' };

/** Si el teléfono tiene huella o cara registrada: sin eso, la pantalla de bloqueo va a la contraseña. */
export async function hayHuella(): Promise<boolean> {
  try {
    const [hardware, registrada] = await Promise.all([
      Autenticacion.hasHardwareAsync(),
      Autenticacion.isEnrolledAsync(),
    ]);
    return hardware && registrada;
  } catch {
    return false;
  }
}

/** Abre el cuadro del sistema. Sin PIN del teléfono como salida: la salida es la contraseña de la cuenta. */
export async function pedirHuella(): Promise<ResultadoHuella> {
  try {
    if (!(await hayHuella())) return { estado: 'no_disponible' };
    const resultado = await Autenticacion.authenticateAsync({
      promptMessage: 'Volvé a entrar a Reporte Ciudadano',
      cancelLabel: 'Usar la contraseña',
      disableDeviceFallback: true,
    });
    if (resultado.success) return { estado: 'ok' };
    switch (resultado.error) {
      case 'user_cancel':
      case 'system_cancel':
      case 'app_cancel':
      case 'user_fallback':
        return { estado: 'cancelado' };
      case 'not_enrolled':
      case 'not_available':
        return { estado: 'no_disponible' };
      case 'lockout':
        return {
          estado: 'fallo',
          mensaje: 'El teléfono bloqueó la huella por ahora. Entrá con tu contraseña.',
        };
      default:
        return { estado: 'fallo', mensaje: 'No reconocimos la huella. Probá de nuevo.' };
    }
  } catch {
    return { estado: 'no_disponible' };
  }
}
