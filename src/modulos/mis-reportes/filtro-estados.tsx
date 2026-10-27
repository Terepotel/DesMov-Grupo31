import { describirElegidos, Desplegable } from '@/componentes/ui/desplegable';
import {
  estadosReporte,
  ORDEN_ESTADOS_VISIBLES,
  type EstadoVisible,
} from '@/componentes/ui/estado-reporte';

/** Todos los estados, «Sin enviar» incluido: al abrir vienen todos elegidos. */
export const ESTADOS_DEL_HISTORIAL = ORDEN_ESTADOS_VISIBLES;

type Props = {
  elegidos: EstadoVisible[];
  alCambiar: (elegidos: EstadoVisible[]) => void;
};

const OPCIONES = ESTADOS_DEL_HISTORIAL.map((estado) => ({
  clave: estado,
  texto: estadosReporte[estado].texto,
  icono: estadosReporte[estado].icono,
  claseIcono: estadosReporte[estado].claseIcono,
}));

/** Filtro por estado del historial: varios a la vez, al abrir vienen todos. */
export function FiltroEstados({ elegidos, alCambiar }: Props) {
  function alternar(clave: string) {
    const estado = clave as EstadoVisible;
    alCambiar(
      elegidos.includes(estado)
        ? elegidos.filter((e) => e !== estado)
        : ESTADOS_DEL_HISTORIAL.filter((e) => e === estado || elegidos.includes(e)),
    );
  }

  return (
    <Desplegable
      rotulo="Estado"
      valor={describirElegidos(OPCIONES, elegidos)}
      multiple
      opciones={OPCIONES}
      elegidas={elegidos}
      alElegir={alternar}
    />
  );
}
