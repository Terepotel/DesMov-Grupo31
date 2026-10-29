import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { ErrorApi } from '@/servicios/api';
import * as servicioSesion from '@/servicios/autenticacion';
import type { Usuario } from '@/tipos';

interface ValorSesion {
  cargando: boolean;
  usuario: Usuario | null;
  /** Con sesión guardada, hasta que pase la huella o la contraseña (R4.7). */
  bloqueada: boolean;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  registrar: (registro: servicioSesion.Registro) => Promise<void>;
  desbloquear: () => void;
  salir: () => Promise<void>;
}

/** Fuera de la app más que esto, al volver se pide la huella de nuevo. */
export const MINUTOS_PARA_BLOQUEAR = 2;

const ContextoSesion = createContext<ValorSesion | null>(null);

export function useSesion() {
  const valor = use(ContextoSesion);
  if (!valor) throw new Error('useSesion tiene que usarse dentro de <ProveedorSesion>');
  return valor;
}

export function ProveedorSesion({ children }: PropsWithChildren) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [bloqueada, setBloqueada] = useState(false);

  useEffect(() => {
    let vigente = true;

    servicioSesion
      .leerSesionGuardada()
      .then((sesion) => {
        if (!vigente) return;
        setUsuario(sesion?.usuario ?? null);
        // Abrir la app con sesión guardada es «volver»: huella antes de mostrar nada.
        setBloqueada(sesion !== null);
        setCargando(false);
        if (!sesion) return;

        servicioSesion
          .obtenerUsuarioActual()
          .then((actual) => vigente && setUsuario(actual))
          .catch(async (error) => {
            if (error instanceof ErrorApi && error.codigo === 'NO_AUTENTICADO') {
              await servicioSesion.cerrarSesion();
              if (vigente) setUsuario(null);
            }
          });
      })
      .catch(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  // Si la app estuvo en segundo plano un rato, al volver se pide la huella de nuevo.
  useEffect(() => {
    let salioEn: number | null = null;
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') salioEn = Date.now();
      else if (estado === 'active' && salioEn !== null) {
        const minutos = (Date.now() - salioEn) / 60_000;
        salioEn = null;
        if (minutos >= MINUTOS_PARA_BLOQUEAR) setBloqueada(true);
      }
    });
    return () => suscripcion.remove();
  }, []);

  async function ingresar(email: string, contrasena: string) {
    setUsuario(await servicioSesion.iniciarSesion(email, contrasena));
  }

  async function registrar(registro: servicioSesion.Registro) {
    setUsuario(await servicioSesion.registrarse(registro));
  }

  function desbloquear() {
    setBloqueada(false);
  }

  async function salir() {
    await servicioSesion.cerrarSesion();
    setUsuario(null);
    setBloqueada(false);
  }

  return (
    <ContextoSesion
      value={{ cargando, usuario, bloqueada, ingresar, registrar, desbloquear, salir }}>
      {children}
    </ContextoSesion>
  );
}
