import { InicioOperador } from '@/modulos/inicio/inicio-operador';
import { InicioVecino } from '@/modulos/inicio/inicio-vecino';
import { useSesion } from '@/modulos/autenticacion/contexto';

// La misma pestaña es el inicio del vecino y la bandeja del operador (R4.6).
export default function PantallaInicio() {
  const { usuario } = useSesion();

  if (!usuario) return null;
  return usuario.rol === 'operador' ? (
    <InicioOperador usuario={usuario} />
  ) : (
    <InicioVecino usuario={usuario} />
  );
}
