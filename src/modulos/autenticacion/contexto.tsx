import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { ErrorApi } from '@/servicios/api';
import * as servicioSesion from '@/servicios/autenticacion';
import type { Usuario } from '@/tipos';

interface ValorSesion {
  cargando: boolean;
  usuario: Usuario | null;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  salir: () => Promise<void>;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

export function useSesion() {
  const valor = use(ContextoSesion);
  if (!valor) throw new Error('useSesion tiene que usarse dentro de <ProveedorSesion>');
  return valor;
}

export function ProveedorSesion({ children }: PropsWithChildren) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let vigente = true;

    servicioSesion
      .leerSesionGuardada()
      .then((sesion) => {
        if (!vigente) return;
        setUsuario(sesion?.usuario ?? null);
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

  async function ingresar(email: string, contrasena: string) {
    setUsuario(await servicioSesion.iniciarSesion(email, contrasena));
  }

  async function salir() {
    await servicioSesion.cerrarSesion();
    setUsuario(null);
  }

  return <ContextoSesion value={{ cargando, usuario, ingresar, salir }}>{children}</ContextoSesion>;
}
